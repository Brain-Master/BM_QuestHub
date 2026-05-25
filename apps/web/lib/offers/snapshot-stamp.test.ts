import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatSnapshotTime,
  isSnapshotStampVisible,
  SNAPSHOT_STAMP_QUERY,
} from "./snapshot-stamp";

describe("isSnapshotStampVisible", () => {
  it("is false without query", () => {
    assert.equal(isSnapshotStampVisible(new URLSearchParams()), false);
    assert.equal(isSnapshotStampVisible(null), false);
  });

  it("is true when datastamp=1", () => {
    const params = new URLSearchParams({ [SNAPSHOT_STAMP_QUERY]: "1" });
    assert.equal(isSnapshotStampVisible(params), true);
  });

  it("is false for other values", () => {
    assert.equal(
      isSnapshotStampVisible(new URLSearchParams({ [SNAPSHOT_STAMP_QUERY]: "true" })),
      false,
    );
  });
});

describe("formatSnapshotTime", () => {
  it("formats displayable ISO in MSK locale shape", () => {
    const label = formatSnapshotTime("2026-05-21T13:47:57.943Z");
    assert.ok(label);
    assert.match(label!, /\d/);
  });

  it("returns null for epoch placeholder", () => {
    assert.equal(formatSnapshotTime(new Date(0).toISOString()), null);
  });
});
