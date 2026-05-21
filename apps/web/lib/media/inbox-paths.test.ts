import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  localizeInboxRelPathForFs,
  shiftGroupIdToInboxDir,
} from "./inbox-paths";

describe("shiftGroupIdToInboxDir", () => {
  it("replaces colons for filesystem-safe inbox folders", () => {
    assert.equal(
      shiftGroupIdToInboxDir("cyber-rhythm:school-1517:2026-06-22:2026-06-26"),
      "cyber-rhythm__school-1517__2026-06-22__2026-06-26",
    );
    assert.equal(shiftGroupIdToInboxDir("SHIFT-001"), "SHIFT-001");
  });
});

describe("localizeInboxRelPathForFs", () => {
  it("sanitizes schedule segment on pull", () => {
    const localized = localizeInboxRelPathForFs(
      "schedule/cyber-rhythm:school-1517:2026-06-22:2026-06-26/hero-16x9.source.jpg",
    );
    assert.ok(localized.includes("cyber-rhythm__school-1517__2026-06-22__2026-06-26"));
    assert.ok(!localized.includes("cyber-rhythm:school"));
  });

  it("leaves non-schedule paths unchanged", () => {
    const localized = localizeInboxRelPathForFs("venues/bm-base-moscow/logo-256.source.png");
    assert.ok(localized.includes("venues"));
    assert.ok(localized.includes("bm-base-moscow"));
  });
});
