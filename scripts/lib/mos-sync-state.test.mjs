import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  batchesComplete,
  clearStaleLockInState,
  computeTargetIntervalSec,
  evaluateControllerGate,
  evaluateControllerPipelineAction,
  isLockActive,
  isStaleProcessingRun,
  jitterSec,
  normalizeSyncState,
  resolveControllerTickNextDueAt,
  tierIntervalSec,
} from "./mos-sync-state.mjs";

describe("mos-sync-state PID", () => {
  it("tierIntervalSec maps visit bands", () => {
    assert.equal(tierIntervalSec(0), 43200);
    assert.equal(tierIntervalSec(1), 1800);
    assert.equal(tierIntervalSec(10), 900);
    assert.equal(tierIntervalSec(50), 300);
  });

  it("high traffic shrinks interval toward T_min (tier fallback)", () => {
    const prev = process.env.MOS_SYNC_USE_PID;
    process.env.MOS_SYNC_USE_PID = "0";
    const { t } = computeTargetIntervalSec(
      { visits1h: 80, dv: 5 },
      { lastSyncAt: new Date().toISOString(), integralError: 0 },
    );
    if (prev === undefined) delete process.env.MOS_SYNC_USE_PID;
    else process.env.MOS_SYNC_USE_PID = prev;
    assert.equal(t, 300);
  });

  it("jitter is bounded", () => {
    for (let i = 0; i < 20; i++) {
      const j = jitterSec(300);
      assert.ok(j >= 0 && j <= 75);
    }
  });
});

describe("resolveControllerTickNextDueAt", () => {
  const now = Date.now();

  it("omits nextDueAt when unset (first run)", () => {
    assert.equal(resolveControllerTickNextDueAt(null, 900, now), undefined);
    assert.equal(resolveControllerTickNextDueAt(undefined, 900, now), undefined);
  });

  it("keeps due nextDueAt without postponing", () => {
    const due = new Date(now - 60_000).toISOString();
    assert.equal(resolveControllerTickNextDueAt(due, 900, now), due);
  });

  it("keeps future nextDueAt", () => {
    const future = new Date(now + 3_600_000).toISOString();
    assert.equal(resolveControllerTickNextDueAt(future, 900, now), future);
  });
});

describe("evaluateControllerGate", () => {
  const now = Date.now();
  const empty = normalizeSyncState(null);

  it("fail-closed when state read failed", () => {
    const gate = evaluateControllerGate(empty, false, now);
    assert.equal(gate.run, false);
    assert.equal(gate.reason, "state_read_failed");
  });

  it("does not treat read failure as no_next_due", () => {
    const gate = evaluateControllerGate(empty, false, now);
    assert.notEqual(gate.reason, "no_next_due");
  });

  it("respects active lock when read ok", () => {
    const locked = {
      ...empty,
      lockUntil: new Date(now + 60_000).toISOString(),
    };
    const gate = evaluateControllerGate(locked, true, now);
    assert.equal(gate.run, false);
    assert.equal(gate.reason, "locked");
  });

  it("runs when no nextDueAt and read ok", () => {
    const gate = evaluateControllerGate(empty, true, now);
    assert.equal(gate.run, true);
    assert.equal(gate.reason, "no_next_due");
  });
});

describe("clearStaleLockInState", () => {
  it("clears expired lockUntil", () => {
    const now = Date.now();
    const state = normalizeSyncState({
      lockUntil: new Date(now - 1000).toISOString(),
    });
    const cleared = clearStaleLockInState(state, now);
    assert.equal(cleared.lockUntil, null);
    assert.equal(isLockActive(cleared, now), false);
  });
});

describe("YMQ pipeline gate", () => {
  const now = Date.now();
  const empty = normalizeSyncState(null);

  it("batchesComplete when done >= total", () => {
    const s = normalizeSyncState({ batchesTotal: 3, batchesDone: 3 });
    assert.equal(batchesComplete(s), true);
  });

  it("processing blocks new plan", () => {
    const s = normalizeSyncState({
      runPhase: "processing",
      batchesTotal: 2,
      batchesDone: 0,
      nextDueAt: new Date(now - 1000).toISOString(),
    });
    const a = evaluateControllerPipelineAction(s, true, now);
    assert.equal(a.action, "none");
    assert.equal(a.reason, "run_in_progress");
  });

  it("processing with all batches done → finalize", () => {
    const s = normalizeSyncState({
      runPhase: "processing",
      activeRunId: "run-1",
      batchesTotal: 2,
      batchesDone: 2,
    });
    const a = evaluateControllerPipelineAction(s, true, now);
    assert.equal(a.action, "finalize");
    assert.equal(a.reason, "batches_complete");
  });

  it("idle + due → plan", () => {
    const s = normalizeSyncState({
      runPhase: "idle",
      nextDueAt: new Date(now - 1000).toISOString(),
    });
    const a = evaluateControllerPipelineAction(s, true, now);
    assert.equal(a.action, "plan");
    assert.equal(a.reason, "due");
  });

  it("stale processing → reset_stale", () => {
    const old = new Date(now - 3 * 60 * 60 * 1000).toISOString();
    const s = normalizeSyncState({
      runPhase: "processing",
      batchesTotal: 1,
      batchesDone: 0,
      plannerAt: old,
      lastBatchAt: old,
    });
    assert.equal(isStaleProcessingRun(s, now), true);
    const a = evaluateControllerPipelineAction(s, true, now);
    assert.equal(a.action, "reset_stale");
    assert.equal(a.reason, "stale_run");
  });
});
