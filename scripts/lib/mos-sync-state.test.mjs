import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeTargetIntervalSec,
  jitterSec,
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
