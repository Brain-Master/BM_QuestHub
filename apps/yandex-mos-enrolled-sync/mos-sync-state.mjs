import { mergeOpsJson, readOpsJson, writeOpsJson } from "./mos-ops-s3.mjs";
import { mosSyncDebug } from "./mos-sync-debug.mjs";
import { loadTrafficRollup } from "./schedule-traffic.mjs";

export const MOS_SYNC_STATE_S3_KEY =
  process.env.MOS_SYNC_STATE_S3_KEY?.trim() || "ops/mos-sync-state.json";

function envNum(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

export function mosSyncPidConfig() {
  return {
    tMinSec: envNum("MOS_SYNC_T_MIN_SEC", 300),
    tMaxSec: envNum("MOS_SYNC_T_MAX_SEC", 86400),
    tBaseSec: envNum("MOS_SYNC_T_BASE_SEC", 3600),
    vRef: envNum("MOS_SYNC_V_REF", 30),
    kp: envNum("MOS_PID_KP", 60),
    kd: envNum("MOS_PID_KD", 30),
    ki: envNum("MOS_PID_KI", 0.05),
    staleTargetSec: envNum("MOS_SYNC_STALE_TARGET_SEC", 1800),
    usePid: process.env.MOS_SYNC_USE_PID?.trim() !== "0",
  };
}

/**
 * @param {unknown} raw
 */
export function normalizeSyncState(raw) {
  const base = {
    lastSyncAt: null,
    nextDueAt: null,
    lastIntervalSec: 900,
    integralError: 0,
    lockUntil: null,
    lastControllerAt: null,
    lastPublishAt: null,
    lastSyncRunId: null,
  };
  if (!raw || typeof raw !== "object") return base;
  const s = /** @type {Record<string, unknown>} */ (raw);
  return {
    ...base,
    lastSyncAt: typeof s.lastSyncAt === "string" ? s.lastSyncAt : null,
    nextDueAt: typeof s.nextDueAt === "string" ? s.nextDueAt : null,
    lastIntervalSec:
      typeof s.lastIntervalSec === "number" && Number.isFinite(s.lastIntervalSec)
        ? s.lastIntervalSec
        : 900,
    integralError:
      typeof s.integralError === "number" && Number.isFinite(s.integralError)
        ? s.integralError
        : 0,
    lockUntil: typeof s.lockUntil === "string" ? s.lockUntil : null,
    lastControllerAt:
      typeof s.lastControllerAt === "string" ? s.lastControllerAt : null,
    lastPublishAt: typeof s.lastPublishAt === "string" ? s.lastPublishAt : null,
    lastSyncRunId: typeof s.lastSyncRunId === "string" ? s.lastSyncRunId : null,
  };
}

/**
 * @param {number} v visits per hour
 */
export function tierIntervalSec(v) {
  if (v >= 50) return 300;
  if (v >= 10) return 900;
  if (v >= 1) return 1800;
  return 43200;
}

/**
 * @param {{ visits1h: number, dv: number }} traffic
 * @param {{ lastSyncAt: string | null, integralError: number }} state
 */
export function computeTargetIntervalSec(traffic, state) {
  const cfg = mosSyncPidConfig();
  const now = Date.now();
  const staleSec = state.lastSyncAt
    ? Math.max(0, (now - Date.parse(state.lastSyncAt)) / 1000)
    : cfg.staleTargetSec * 2;

  let tRaw = cfg.tBaseSec;
  let integral = state.integralError;

  if (cfg.usePid) {
    tRaw =
      cfg.tBaseSec +
      cfg.kp * (cfg.vRef - traffic.visits1h) -
      cfg.kd * traffic.dv +
      cfg.ki * (staleSec - cfg.staleTargetSec);
    integral += staleSec - cfg.staleTargetSec;
  } else {
    tRaw = tierIntervalSec(traffic.visits1h);
    integral = 0;
  }

  let t = Math.round(
    Math.min(cfg.tMaxSec, Math.max(cfg.tMinSec, tRaw)),
  );

  if (t <= cfg.tMinSec + 1) {
    integral = Math.min(integral, cfg.staleTargetSec);
  }

  return { t, tRaw, integral, staleSec, cfg };
}

/**
 * @param {number} tSec
 */
export function jitterSec(tSec) {
  const cap = Math.min(tSec * 0.25, 180);
  return Math.floor(Math.random() * cap);
}

/**
 * @param {number} tSec
 * @param {number} [fromMs]
 */
export function computeNextDueAt(tSec, fromMs = Date.now()) {
  const j = jitterSec(tSec);
  return new Date(fromMs + tSec * 1000 + j * 1000).toISOString();
}

export async function loadSyncState() {
  const stored = await readOpsJson(MOS_SYNC_STATE_S3_KEY);
  return normalizeSyncState(stored?.data);
}

/**
 * @param {number} lockMs
 */
export async function acquireSyncLock(lockMs = 10 * 60 * 1000) {
  const now = Date.now();
  const lockUntil = new Date(now + lockMs).toISOString();
  let acquired = false;

  const merged = await mergeOpsJson(MOS_SYNC_STATE_S3_KEY, (raw) => {
    const state = normalizeSyncState(raw);
    if (state.lockUntil && Date.parse(state.lockUntil) > now) {
      acquired = false;
      return state;
    }
    acquired = true;
    return { ...state, lockUntil };
  });

  if (merged === null) return null;
  return acquired ? lockUntil : null;
}

export async function releaseSyncLock() {
  const merged = await mergeOpsJson(MOS_SYNC_STATE_S3_KEY, (raw) => {
    const state = normalizeSyncState(raw);
    return { ...state, lockUntil: null };
  });
  return merged !== null;
}

/**
 * @param {Partial<ReturnType<typeof normalizeSyncState>>} patch
 */
export async function patchSyncState(patch) {
  mosSyncDebug("patchSyncState", patch);
  const merged = await mergeOpsJson(MOS_SYNC_STATE_S3_KEY, (raw) => {
    const state = normalizeSyncState(raw);
    return { ...state, ...patch };
  });
  const ok = merged !== null;
  if (!ok) {
    console.warn(
      `[mos-sync-state] patchSyncState failed (${MOS_SYNC_STATE_S3_KEY})`,
    );
  }
  return ok;
}

/**
 * @param {{ ok: boolean, hadChanges?: boolean, publishAt?: string, runId?: string }} result
 */
export async function onSyncFinished(result) {
  const traffic = await loadTrafficRollup();
  const state = await loadSyncState();
  const { t, integral } = computeTargetIntervalSec(traffic, state);
  const now = Date.now();
  const patch = {
    lastSyncAt: new Date(now).toISOString(),
    lastIntervalSec: t,
    integralError: integral,
    lockUntil: null,
    lastSyncRunId: result.runId ?? state.lastSyncRunId,
  };
  if (result.publishAt) patch.lastPublishAt = result.publishAt;
  if (result.ok) {
    patch.nextDueAt = computeNextDueAt(t, now);
  } else {
    const backoff = Math.min(
      mosSyncPidConfig().tMaxSec,
      Math.max(mosSyncPidConfig().tMinSec, t * 2),
    );
    patch.nextDueAt = computeNextDueAt(backoff, now);
  }
  const stateOk = await patchSyncState(patch);
  if (!stateOk) {
    console.warn(
      "[mos-sync-state] onSyncFinished: lastSyncAt not persisted (S3)",
    );
  } else {
    mosSyncDebug("onSyncFinished ok", {
      lastSyncAt: patch.lastSyncAt,
      nextDueAt: patch.nextDueAt,
      runId: patch.lastSyncRunId,
    });
  }
  return { traffic, intervalSec: t, nextDueAt: patch.nextDueAt, stateOk };
}

/**
 * nextDueAt for controller tick — never postpone a due or missing schedule.
 * Returns `undefined` to omit nextDueAt from the S3 patch (first run / invalid).
 * @param {string | null | undefined} currentNextDueAt
 * @param {number} [_intervalSec]
 * @param {number} [nowMs]
 * @returns {string | undefined}
 */
export function resolveControllerTickNextDueAt(
  currentNextDueAt,
  _intervalSec,
  nowMs = Date.now(),
) {
  if (!currentNextDueAt) return undefined;
  const dueMs = Date.parse(currentNextDueAt);
  if (!Number.isFinite(dueMs)) return undefined;
  if (dueMs > nowMs) return currentNextDueAt;
  return currentNextDueAt;
}

/**
 * @param {number} [nowMs]
 */
export async function controllerShouldRunSync(nowMs = Date.now()) {
  const state = await loadSyncState();
  if (state.lockUntil && Date.parse(state.lockUntil) > nowMs) {
    return { run: false, reason: "locked", state };
  }
  if (!state.nextDueAt) {
    return { run: true, reason: "no_next_due", state };
  }
  if (Date.parse(state.nextDueAt) <= nowMs) {
    return { run: true, reason: "due", state };
  }
  return { run: false, reason: "not_due", state };
}

/**
 * @param {number} [nowMs]
 */
export async function tickControllerState(nowMs = Date.now()) {
  const traffic = await loadTrafficRollup(nowMs);
  const state = await loadSyncState();
  const { t, tRaw, integral } = computeTargetIntervalSec(traffic, state);
  const nextDueAt = resolveControllerTickNextDueAt(state.nextDueAt, t, nowMs);

  /** @type {Partial<ReturnType<typeof normalizeSyncState>>} */
  const patch = {
    lastControllerAt: new Date(nowMs).toISOString(),
    lastIntervalSec: t,
    integralError: integral,
  };
  if (nextDueAt !== undefined) patch.nextDueAt = nextDueAt;

  const stateOk = await patchSyncState(patch);

  return {
    traffic,
    intervalSec: t,
    tRaw,
    nextDueAt: nextDueAt ?? state.nextDueAt,
    state,
    stateOk,
    stateError: stateOk ? null : "s3_state_write_failed",
  };
}
