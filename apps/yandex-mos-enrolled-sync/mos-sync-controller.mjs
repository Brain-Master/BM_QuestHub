import { mosSyncDebug } from "./mos-sync-debug.mjs";
import { invokeMosEnrolledSync } from "./mos-sync-invoke.mjs";
import {
  acquireSyncLock,
  controllerShouldRunSync,
  releaseSyncLock,
  tickControllerState,
} from "./mos-sync-state.mjs";

const FALLBACK_TRAFFIC = {
  visits5m: 0,
  visits15m: 0,
  visits1h: 0,
  visits6h: 0,
  dv: 0,
};

/**
 * One controller tick: gate on current state, refresh PID metrics, optionally invoke sync.
 */
export async function runMosSyncControllerTick() {
  let gate = { run: false, reason: "gate_error", state: null };
  try {
    mosSyncDebug("controller gate check");
    gate = await controllerShouldRunSync();
    mosSyncDebug("controller gate", { run: gate.run, reason: gate.reason });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[mos-controller] controllerShouldRunSync:", message);
    return {
      ok: false,
      invoked: false,
      reason: "gate_error",
      error: message,
      stateOk: false,
      stateError: message,
      nextDueAt: null,
      intervalSec: 900,
      traffic: FALLBACK_TRAFFIC,
    };
  }

  let tick = {
    traffic: FALLBACK_TRAFFIC,
    intervalSec: 900,
    nextDueAt: gate.state?.nextDueAt ?? null,
    stateOk: false,
    stateError: null,
  };

  try {
    const t = await tickControllerState();
    tick = {
      traffic: t.traffic,
      intervalSec: t.intervalSec,
      nextDueAt: t.nextDueAt,
      stateOk: t.stateOk !== false,
      stateError: t.stateError ?? null,
    };
  } catch (err) {
    tick.stateError = err instanceof Error ? err.message : String(err);
    console.warn("[mos-controller] tickControllerState:", tick.stateError);
  }

  if (!gate.run) {
    return {
      ok: true,
      invoked: false,
      reason: gate.reason,
      stateOk: tick.stateOk,
      stateError: tick.stateError,
      nextDueAt: tick.nextDueAt,
      intervalSec: tick.intervalSec,
      traffic: tick.traffic,
    };
  }

  let lockUntil = null;
  try {
    lockUntil = await acquireSyncLock();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[mos-controller] acquireSyncLock:", message);
    return {
      ok: false,
      invoked: false,
      reason: "lock_error",
      error: message,
      stateOk: tick.stateOk,
      stateError: tick.stateError,
      nextDueAt: tick.nextDueAt,
      intervalSec: tick.intervalSec,
      traffic: tick.traffic,
    };
  }

  if (!lockUntil) {
    return {
      ok: true,
      invoked: false,
      reason: "lock_busy",
      stateOk: tick.stateOk,
      stateError: tick.stateError,
      nextDueAt: tick.nextDueAt,
      intervalSec: tick.intervalSec,
      traffic: tick.traffic,
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
      stateOk: tick.stateOk,
      stateError: tick.stateError,
      nextDueAt: tick.nextDueAt,
      intervalSec: tick.intervalSec,
      traffic: tick.traffic,
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
