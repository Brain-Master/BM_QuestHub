import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

import { isMosSyncDebug, mosSyncDebug } from "./mos-sync-debug.mjs";

describe("mos-sync-debug", () => {
  /** @type {string | undefined} */
  let prevSync;
  /** @type {string | undefined} */
  let prevEnrolled;

  beforeEach(() => {
    prevSync = process.env.MOS_SYNC_DEBUG;
    prevEnrolled = process.env.MOS_ENROLLED_DEBUG;
    delete process.env.MOS_SYNC_DEBUG;
    delete process.env.MOS_ENROLLED_DEBUG;
  });

  afterEach(() => {
    if (prevSync === undefined) delete process.env.MOS_SYNC_DEBUG;
    else process.env.MOS_SYNC_DEBUG = prevSync;
    if (prevEnrolled === undefined) delete process.env.MOS_ENROLLED_DEBUG;
    else process.env.MOS_ENROLLED_DEBUG = prevEnrolled;
  });

  it("is off by default", () => {
    assert.equal(isMosSyncDebug(), false);
  });

  it("mosSyncDebug is no-op when off", () => {
    mosSyncDebug("hidden");
    assert.equal(isMosSyncDebug(), false);
  });
});
