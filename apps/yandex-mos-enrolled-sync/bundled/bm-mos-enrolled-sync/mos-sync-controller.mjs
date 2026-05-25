import { mosSyncDebug } from "./mos-sync-debug.mjs";
import { invokeMosEnrolledSync } from "./mos-sync-invoke.mjs";
import { runMosSyncControllerPipelineTick } from "./mos-sync-controller-pipeline.mjs";
import {
  computeControllerTickMetrics,
  computeTargetIntervalSec,
  evaluateControllerGate,
  loadSyncStateWithMeta,
  mosSyncPipelineMode,
  patchControllerInvokeState,
  releaseSyncLock,
} from "./mos-sync-state.mjs";

const FALLBACK_TRAFFIC = {
  visits5m: 0,
  visits15m: 0,
  visits1h: 0,
  visits6h: 0,
  dv: 0,
};

/**
 * One controller tick: single state read, S3 write only when invoking sync.
 */
export async function runMosSyncControllerTick() {
  if (mosSyncPipelineMode() === "ymq") {
    return runMosSyncControllerPipelineTick();
  }
  const nowMs = Date.now();

  let loaded;
  try {
    loaded = await loadSyncStateWithMeta();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[mos-controller] loadSyncStateWithMeta:", message);
    return {
      ok: false,
      invoked: false,
      reason: "state_load_error",
      error: message,
      stateOk: false,
      stateError: message,
      nextDueAt: null,
      intervalSec: 900,
      traffic: FALLBACK_TRAFFIC,
    };
  }

  const { state, readOk: stateReadOk } = loaded;
  const gate = evaluateControllerGate(state, stateReadOk, nowMs);
  mosSyncDebug("controller gate", { run: gate.run, reason: gate.reason });

  if (!gate.run) {
    return {
      ok: gate.reason !== "state_read_failed",
      invoked: false,
      reason: gate.reason,
      stateOk: stateReadOk,
      stateError: stateReadOk ? null : "state_read_failed",
      nextDueAt: gate.state.nextDueAt,
      intervalSec: gate.state.lastIntervalSec,
      traffic: FALLBACK_TRAFFIC,
    };
  }

  const metrics = await computeControllerTickMetrics(gate.state, nowMs);
  const { integral } = computeTargetIntervalSec(metrics.traffic, gate.state);

  let lockResult;
  try {
    lockResult = await patchControllerInvokeState(nowMs, gate.state, {
      intervalSec: metrics.intervalSec,
      integralError: integral,
      nextDueAt: metrics.nextDueAt ?? undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[mos-controller] patchControllerInvokeState:", message);
    return {
      ok: false,
      invoked: false,
      reason: "lock_error",
      error: message,
      stateOk: false,
      stateError: message,
      nextDueAt: metrics.nextDueAt,
      intervalSec: metrics.intervalSec,
      traffic: metrics.traffic,
    };
  }

  if (!lockResult.acquired) {
    return {
      ok: true,
      invoked: false,
      reason: lockResult.stateOk ? "lock_busy" : "state_write_failed",
      stateOk: lockResult.stateOk,
      stateError: lockResult.stateOk ? null : "s3_state_write_failed",
      nextDueAt: metrics.nextDueAt,
      intervalSec: metrics.intervalSec,
      traffic: metrics.traffic,
    };
  }

  try {
    const invoke = await invokeMosEnrolledSync();
    const ok =
      invoke.status === 202 ||
      (invoke.status >= 200 && invoke.status < 300);

    return {
      ok,
      invoked: true,
      reason: gate.reason,
      invokeStatus: invoke.status,
      invokeBody: invoke.body,
      stateOk: lockResult.stateOk,
      stateError: lockResult.stateOk ? null : "s3_state_write_failed",
      nextDueAt: metrics.nextDueAt,
      intervalSec: metrics.intervalSec,
      traffic: metrics.traffic,
    };
  } catch (err) {
    await releaseSyncLock().catch((e) => {
      console.warn(
        "[mos-controller] releaseSyncLock:",
        e instanceof Error ? e.message : String(e),
      );
    });
    throw err;
  }
}
