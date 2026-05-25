import { mosSyncDebug } from "./mos-sync-debug.mjs";
import { notifyMosSyncFailure } from "./mos-sync-failure-alert.mjs";
import {
  invokeMosSyncFinalizer,
  invokeMosSyncPlanner,
} from "./mos-sync-invoke.mjs";
import {
  computeControllerTickMetrics,
  computeTargetIntervalSec,
  evaluateControllerPipelineAction,
  loadSyncStateWithMeta,
  patchControllerInvokeState,
  patchFinalizeRunStarted,
  releaseSyncLock,
  resetPipelineRunToIdle,
} from "./mos-sync-state.mjs";

const FALLBACK_TRAFFIC = {
  visits5m: 0,
  visits15m: 0,
  visits1h: 0,
  visits6h: 0,
  dv: 0,
};

/**
 * YMQ pipeline controller tick: planner or finalizer (async), not monolith sync.
 */
export async function runMosSyncControllerPipelineTick() {
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
      pipeline: "ymq",
      traffic: FALLBACK_TRAFFIC,
    };
  }

  const { state, readOk: stateReadOk } = loaded;
  let action = evaluateControllerPipelineAction(state, stateReadOk, nowMs);
  mosSyncDebug("controller pipeline", {
    action: action.action,
    reason: action.reason,
    runPhase: action.state.runPhase,
    batches: `${action.state.batchesDone}/${action.state.batchesTotal}`,
  });

  if (action.action === "reset_stale") {
    await resetPipelineRunToIdle();
    try {
      await notifyMosSyncFailure({
        kind: "stale_run",
        message: `Reset stale MOS run ${action.state.activeRunId ?? "?"}`,
        dryRun: false,
      });
    } catch {
      /* optional */
    }
    loaded = await loadSyncStateWithMeta();
    action = evaluateControllerPipelineAction(loaded.state, loaded.readOk, nowMs);
  }

  if (action.action === "none") {
    return {
      ok: action.reason !== "state_read_failed",
      invoked: false,
      reason: action.reason,
      pipeline: "ymq",
      runPhase: action.state.runPhase,
      activeRunId: action.state.activeRunId,
      batchesDone: action.state.batchesDone,
      batchesTotal: action.state.batchesTotal,
      nextDueAt: action.state.nextDueAt,
      intervalSec: action.state.lastIntervalSec,
      traffic: FALLBACK_TRAFFIC,
    };
  }

  if (action.action === "finalize") {
    const runId = action.state.activeRunId;
    if (!runId) {
      return {
        ok: false,
        invoked: false,
        reason: "no_active_run",
        pipeline: "ymq",
        traffic: FALLBACK_TRAFFIC,
      };
    }
    try {
      await patchFinalizeRunStarted(runId);
      const invoke = await invokeMosSyncFinalizer({ runId });
      const ok =
        invoke.status === 202 ||
        (invoke.status >= 200 && invoke.status < 300);
      return {
        ok,
        invoked: true,
        action: "finalize",
        reason: action.reason,
        runId,
        invokeStatus: invoke.status,
        pipeline: "ymq",
        traffic: FALLBACK_TRAFFIC,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        invoked: false,
        reason: "finalize_invoke_error",
        error: message,
        pipeline: "ymq",
        traffic: FALLBACK_TRAFFIC,
      };
    }
  }

  const metrics = await computeControllerTickMetrics(action.state, nowMs);
  const { integral } = computeTargetIntervalSec(metrics.traffic, action.state);

  let lockResult;
  try {
    lockResult = await patchControllerInvokeState(nowMs, action.state, {
      intervalSec: metrics.intervalSec,
      integralError: integral,
      nextDueAt: metrics.nextDueAt ?? undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      invoked: false,
      reason: "lock_error",
      error: message,
      pipeline: "ymq",
      traffic: metrics.traffic,
    };
  }

  if (!lockResult.acquired) {
    return {
      ok: true,
      invoked: false,
      reason: lockResult.stateOk ? "lock_busy" : "state_write_failed",
      pipeline: "ymq",
      traffic: metrics.traffic,
    };
  }

  try {
    const invoke = await invokeMosSyncPlanner();
    const ok =
      invoke.status === 202 ||
      (invoke.status >= 200 && invoke.status < 300);
    return {
      ok,
      invoked: true,
      action: "plan",
      reason: action.reason,
      invokeStatus: invoke.status,
      pipeline: "ymq",
      nextDueAt: metrics.nextDueAt,
      intervalSec: metrics.intervalSec,
      traffic: metrics.traffic,
    };
  } catch (err) {
    await releaseSyncLock().catch(() => {});
    throw err;
  }
}
