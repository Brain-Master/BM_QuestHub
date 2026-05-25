import {
  mergeOpsJson,
  readOpsJsonWithMeta,
  writeOpsJson,
} from "./mos-ops-s3.mjs";
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

/** @returns {"legacy" | "ymq"} */
export function mosSyncPipelineMode() {
  const p = process.env.MOS_SYNC_PIPELINE?.trim().toLowerCase();
  return p === "legacy" ? "legacy" : "ymq";
}

function envMs(name, fallbackMs) {
  return envNum(name, fallbackMs);
}

export function mosSyncRunStaleMs() {
  return envMs("MOS_SYNC_RUN_STALE_MS", 2 * 60 * 60 * 1000);
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
    runPhase: "idle",
    activeRunId: null,
    batchesTotal: 0,
    batchesDone: 0,
    batchesFailed: 0,
    plannerAt: null,
    lastBatchAt: null,
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
    runPhase:
      s.runPhase === "processing" ||
      s.runPhase === "finalizing" ||
      s.runPhase === "idle"
        ? s.runPhase
        : "idle",
    activeRunId: typeof s.activeRunId === "string" ? s.activeRunId : null,
    batchesTotal:
      typeof s.batchesTotal === "number" && Number.isFinite(s.batchesTotal)
        ? Math.max(0, Math.round(s.batchesTotal))
        : 0,
    batchesDone:
      typeof s.batchesDone === "number" && Number.isFinite(s.batchesDone)
        ? Math.max(0, Math.round(s.batchesDone))
        : 0,
    batchesFailed:
      typeof s.batchesFailed === "number" && Number.isFinite(s.batchesFailed)
        ? Math.max(0, Math.round(s.batchesFailed))
        : 0,
    plannerAt: typeof s.plannerAt === "string" ? s.plannerAt : null,
    lastBatchAt: typeof s.lastBatchAt === "string" ? s.lastBatchAt : null,
  };
}

/**
 * @param {ReturnType<typeof normalizeSyncState>} state
 */
export function batchesComplete(state) {
  return (
    state.batchesTotal > 0 &&
    state.batchesDone >= state.batchesTotal
  );
}

/**
 * @param {ReturnType<typeof normalizeSyncState>} state
 * @param {number} [nowMs]
 */
export function isStaleProcessingRun(state, nowMs = Date.now()) {
  if (state.runPhase !== "processing" && state.runPhase !== "finalizing") {
    return false;
  }
  const ref = state.lastBatchAt || state.plannerAt;
  if (!ref) return false;
  const t = Date.parse(ref);
  if (!Number.isFinite(t)) return false;
  return nowMs - t > mosSyncRunStaleMs();
}

/**
 * @param {ReturnType<typeof normalizeSyncState>} state
 * @param {boolean} readOk
 * @param {number} [nowMs]
 */
export function evaluateControllerPipelineAction(state, readOk, nowMs = Date.now()) {
  if (!readOk) {
    return { action: "none", reason: "state_read_failed", state };
  }
  state = clearStaleLockInState(state, nowMs);

  if (isStaleProcessingRun(state, nowMs)) {
    return { action: "reset_stale", reason: "stale_run", state };
  }

  if (state.runPhase === "processing") {
    if (batchesComplete(state)) {
      return { action: "finalize", reason: "batches_complete", state };
    }
    return { action: "none", reason: "run_in_progress", state };
  }

  if (state.runPhase === "finalizing") {
    return { action: "none", reason: "finalizing", state };
  }

  if (isLockActive(state, nowMs)) {
    return { action: "none", reason: "locked", state };
  }

  if (!state.nextDueAt) {
    return { action: "plan", reason: "no_next_due", state };
  }
  if (Date.parse(state.nextDueAt) <= nowMs) {
    return { action: "plan", reason: "due", state };
  }
  return { action: "none", reason: "not_due", state };
}

/**
 * Reset YMQ run fields to idle (keeps PID fields).
 */
export async function resetPipelineRunToIdle() {
  return patchSyncState({
    runPhase: "idle",
    activeRunId: null,
    batchesTotal: 0,
    batchesDone: 0,
    batchesFailed: 0,
    plannerAt: null,
    lastBatchAt: null,
    lockUntil: null,
  });
}

/**
 * @param {{ failed?: boolean }} [opts]
 */
/**
 * @param {{ runId: string, batchesTotal: number }} params
 */
export async function patchPlannerRunStarted(params) {
  const now = new Date().toISOString();
  return patchSyncState({
    runPhase: "processing",
    activeRunId: params.runId,
    batchesTotal: params.batchesTotal,
    batchesDone: 0,
    batchesFailed: 0,
    plannerAt: now,
    lastBatchAt: null,
    lastSyncRunId: params.runId,
  });
}

/**
 * @param {string} runId
 */
export async function patchFinalizeRunStarted(runId) {
  return patchSyncState({
    runPhase: "finalizing",
    activeRunId: runId,
  });
}

export async function recordBatchProgress(opts = {}) {
  const now = new Date().toISOString();
  const merged = await mergeOpsJson(MOS_SYNC_STATE_S3_KEY, (raw) => {
    const state = normalizeSyncState(raw);
    const patch = {
      batchesDone: state.batchesDone + 1,
      lastBatchAt: now,
    };
    if (opts.failed) {
      patch.batchesFailed = state.batchesFailed + 1;
    }
    return { ...state, ...patch };
  });
  return merged !== null;
}

/**
 * @param {ReturnType<typeof normalizeSyncState>} state
 * @param {number} [nowMs]
 */
export function isLockActive(state, nowMs = Date.now()) {
  if (!state.lockUntil) return false;
  const until = Date.parse(state.lockUntil);
  return Number.isFinite(until) && until > nowMs;
}

/**
 * @param {ReturnType<typeof normalizeSyncState>} state
 * @param {number} [nowMs]
 */
export function clearStaleLockInState(state, nowMs = Date.now()) {
  if (!state.lockUntil) return state;
  const until = Date.parse(state.lockUntil);
  if (Number.isFinite(until) && until <= nowMs) {
    return { ...state, lockUntil: null };
  }
  return state;
}

/**
 * @returns {Promise<{ state: ReturnType<typeof normalizeSyncState>, readOk: boolean }>}
 */
export async function loadSyncStateWithMeta() {
  const stored = await readOpsJsonWithMeta(MOS_SYNC_STATE_S3_KEY);
  let state = normalizeSyncState(stored.data);
  if (stored.readOk) {
    state = clearStaleLockInState(state);
  }
  return { state, readOk: stored.readOk };
}

export async function loadSyncState() {
  const { state } = await loadSyncStateWithMeta();
  return state;
}

/**
 * @param {ReturnType<typeof normalizeSyncState>} state
 * @param {boolean} readOk
 * @param {number} [nowMs]
 */
export function evaluateControllerGate(state, readOk, nowMs = Date.now()) {
  if (!readOk) {
    return { run: false, reason: "state_read_failed", state };
  }
  state = clearStaleLockInState(state, nowMs);
  if (isLockActive(state, nowMs)) {
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

/**
 * @param {number} lockMs
 */
export async function acquireSyncLock(lockMs = 10 * 60 * 1000) {
  const now = Date.now();
  const lockUntil = new Date(now + lockMs).toISOString();
  let acquired = false;

  const merged = await mergeOpsJson(MOS_SYNC_STATE_S3_KEY, (raw) => {
    const state = normalizeSyncState(raw);
    const cleared = clearStaleLockInState(state, now);
    if (isLockActive(cleared, now)) {
      acquired = false;
      return cleared;
    }
    acquired = true;
    return { ...cleared, lockUntil };
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
 * @param {ReturnType<typeof normalizeSyncState>} [knownState]
 */
export async function onSyncFinished(result, knownState = null) {
  const traffic = await loadTrafficRollup();
  const state =
    knownState ?? (await loadSyncStateWithMeta()).state;
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

  const mergedState = { ...state, ...patch };
  let stateOk = await patchSyncState(patch);
  if (!stateOk) {
    console.warn(
      "[mos-sync-state] onSyncFinished: merge failed — direct writeOpsJson fallback",
    );
    stateOk = await writeOpsJson(MOS_SYNC_STATE_S3_KEY, mergedState, {
      maxAttempts: 4,
    });
  }
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
  const { state, readOk } = await loadSyncStateWithMeta();
  return evaluateControllerGate(state, readOk, nowMs);
}

/**
 * Compute PID metrics without writing S3 (for controller tick planning).
 * @param {ReturnType<typeof normalizeSyncState>} state
 * @param {number} [nowMs]
 */
export async function computeControllerTickMetrics(state, nowMs = Date.now()) {
  const traffic = await loadTrafficRollup(nowMs);
  const { t, tRaw, integral } = computeTargetIntervalSec(traffic, state);
  const nextDueAt = resolveControllerTickNextDueAt(state.nextDueAt, t, nowMs);
  return {
    traffic,
    intervalSec: t,
    tRaw,
    nextDueAt: nextDueAt ?? state.nextDueAt,
  };
}

/**
 * @param {number} [nowMs]
 */
export async function tickControllerState(nowMs = Date.now()) {
  const { state, readOk } = await loadSyncStateWithMeta();
  if (!readOk) {
    return {
      traffic: await loadTrafficRollup(nowMs),
      intervalSec: 900,
      tRaw: 900,
      nextDueAt: state.nextDueAt,
      state,
      stateOk: false,
      stateError: "state_read_failed",
    };
  }

  const metrics = await computeControllerTickMetrics(state, nowMs);
  const { integral } = computeTargetIntervalSec(metrics.traffic, state);

  /** @type {Partial<ReturnType<typeof normalizeSyncState>>} */
  const patch = {
    lastControllerAt: new Date(nowMs).toISOString(),
    lastIntervalSec: metrics.intervalSec,
    integralError: integral,
  };
  if (metrics.nextDueAt !== undefined) patch.nextDueAt = metrics.nextDueAt;

  const stateOk = await patchSyncState(patch);

  return {
    traffic: metrics.traffic,
    intervalSec: metrics.intervalSec,
    tRaw: metrics.tRaw,
    nextDueAt: metrics.nextDueAt,
    state,
    stateOk,
    stateError: stateOk ? null : "s3_state_write_failed",
  };
}

/**
 * Single merge when controller will invoke sync: lock + optional controller fields.
 * @param {number} nowMs
 * @param {ReturnType<typeof normalizeSyncState>} state
 * @param {{ intervalSec: number, integralError: number, nextDueAt?: string | null }} metrics
 * @param {number} lockMs
 */
export async function patchControllerInvokeState(
  nowMs,
  state,
  metrics,
  lockMs = 10 * 60 * 1000,
) {
  const lockUntil = new Date(nowMs + lockMs).toISOString();
  const cleared = clearStaleLockInState(state, nowMs);
  if (isLockActive(cleared, nowMs)) {
    return { lockUntil: null, acquired: false, stateOk: false };
  }

  /** @type {Partial<ReturnType<typeof normalizeSyncState>>} */
  const patch = {
    lockUntil,
    lastControllerAt: new Date(nowMs).toISOString(),
    lastIntervalSec: metrics.intervalSec,
    integralError: metrics.integralError,
  };
  if (metrics.nextDueAt !== undefined) patch.nextDueAt = metrics.nextDueAt;

  const merged = { ...cleared, ...patch };
  let stateOk = await patchSyncState(patch);
  if (!stateOk) {
    stateOk = await writeOpsJson(MOS_SYNC_STATE_S3_KEY, merged, { maxAttempts: 4 });
  }
  return { lockUntil, acquired: stateOk, stateOk };
}
