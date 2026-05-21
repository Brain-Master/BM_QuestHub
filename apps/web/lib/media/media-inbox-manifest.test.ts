import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MediaInboxContext } from "./design-pack-slots";
import {
  enumerateInboxSlots,
  isInboxPullPath,
  planSlotPush,
} from "./media-inbox-manifest";

const miniContext: MediaInboxContext = {
  questSlugs: ["demo-quest"],
  worldSlugs: ["demo-world"],
  venues: [{ scopeSlug: "school-1", venueSlug: "school-1-campus" }],
  shiftGroupIds: ["cyber-rhythm:school-1517:2026-06-22:2026-06-26"],
};

describe("enumerateInboxSlots", () => {
  it("includes quest, world, venue, schedule slots", () => {
    const slots = enumerateInboxSlots(miniContext);
    assert.ok(slots.some((s) => s.inboxRelPath === "quests/demo-quest/hero-16x9.source.jpg"));
    assert.ok(slots.some((s) => s.inboxRelPath === "worlds/demo-world/hero-16x9.source.jpg"));
    assert.ok(slots.some((s) => s.inboxRelPath.includes("venues/school-1/logo-256.source.png")));
    assert.ok(
      slots.some(
        (s) =>
          s.inboxRelPath ===
          "schedule/cyber-rhythm__school-1517__2026-06-22__2026-06-26/compact-4x3.source.jpg",
      ),
    );
    assert.ok(slots.some((s) => s.isVideo && s.inboxRelPath === "quests/demo-quest/hero.mp4"));
  });
});

describe("isInboxPullPath", () => {
  it("accepts source files and hero.mp4", () => {
    assert.equal(isInboxPullPath("quests/x/hero-16x9.source.jpg"), true);
    assert.equal(isInboxPullPath("quests/x/hero.mp4"), true);
    assert.equal(isInboxPullPath("README.txt"), false);
  });
});

describe("planSlotPush", () => {
  it("skips when Drive file exists and not force", () => {
    const r = planSlotPush({
      driveFileExists: true,
      localSourcePath: "/tmp/hero.jpg",
      force: false,
    });
    assert.equal(r.action, "skip");
    if (r.action === "skip") assert.equal(r.reason, "drive_exists");
  });

  it("uploads source when force even if Drive has file", () => {
    const r = planSlotPush({
      driveFileExists: true,
      localSourcePath: "/tmp/hero.jpg",
      force: true,
    });
    assert.equal(r.action, "upload");
    if (r.action === "upload") assert.equal(r.payloadKind, "source");
  });

  it("uploads placeholder when no local and no Drive file", () => {
    const r = planSlotPush({
      driveFileExists: false,
      localSourcePath: null,
      force: false,
    });
    assert.equal(r.action, "upload");
    if (r.action === "upload") assert.equal(r.payloadKind, "placeholder");
  });

  it("skips optional video when missing locally", () => {
    const r = planSlotPush({
      driveFileExists: false,
      localSourcePath: null,
      force: false,
      isVideo: true,
    });
    assert.equal(r.action, "skip");
    if (r.action === "skip") assert.equal(r.reason, "optional_video_missing");
  });
});
