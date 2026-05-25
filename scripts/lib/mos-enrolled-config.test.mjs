import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  applyMosEnrolledConfig,
  readMosEnrolledConfigFile,
  writeMosEnrolledConfigFile,
} from "./mos-enrolled-config.mjs";

describe("mos-enrolled-config", () => {
  it("writes and reads intervalMinutes", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mos-cfg-"));
    writeMosEnrolledConfigFile(root, { intervalMinutes: 30, urlDelayMs: 900 });
    const cfg = readMosEnrolledConfigFile(root);
    assert.equal(cfg.intervalMinutes, 30);
    assert.equal(cfg.urlDelayMs, 900);
  });

  it("env overrides config file", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mos-cfg-"));
    writeMosEnrolledConfigFile(root, { intervalMinutes: 30 });
    const prev = process.env.MOS_ENROLLED_INTERVAL_MINUTES;
    process.env.MOS_ENROLLED_INTERVAL_MINUTES = "5";
    try {
      const cfg = applyMosEnrolledConfig(root);
      assert.equal(cfg.intervalMinutes, 5);
    } finally {
      if (prev === undefined) delete process.env.MOS_ENROLLED_INTERVAL_MINUTES;
      else process.env.MOS_ENROLLED_INTERVAL_MINUTES = prev;
    }
  });
});
