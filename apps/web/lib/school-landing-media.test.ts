import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_SCHOOL_LANDING_SCOPE } from "@/lib/media/design-pack-slots";
import type { MediaIngestManifest } from "@/lib/media/manifest";
import { resolveSchoolLandingMedia } from "./school-landing-media";

function manifestWith(entries: MediaIngestManifest["entries"]): MediaIngestManifest {
  return { version: 1, entries };
}

describe("resolveSchoolLandingMedia", () => {
  it("merges venue gallery before default and picks scoped video", () => {
    const manifest = manifestWith({
      "venue-landing:school-17:video": {
        sourceUrl: "venues/school-17/landing-30s.mp4",
        sha256: "a",
        output: "media/venues/school-17/landing-30s.mp4",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      "venue-landing:school-17:poster": {
        sourceUrl: "venues/school-17/landing-poster.source.jpg",
        sha256: "b",
        output: "media/venues/school-17/landing-poster.webp",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      "venue-activity:school-17:01": {
        sourceUrl: "venues/school-17/activity-gallery/gallery-01.source.jpg",
        sha256: "c",
        output: "media/venues/school-17/activity-gallery/01.webp",
        updatedAt: "2026-01-01T00:00:00.000Z",
        caption: "Школа",
      },
      [`venue-activity:${DEFAULT_SCHOOL_LANDING_SCOPE}:01`]: {
        sourceUrl: "venues/_default/activity-gallery/gallery-01.source.jpg",
        sha256: "d",
        output: "media/venues/_default/activity-gallery/01.webp",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const media = resolveSchoolLandingMedia("school-17", manifest);
    assert.match(media.videoFileUrl ?? "", /school-17\/landing-30s\.mp4/);
    assert.equal(media.activityGallery.length, 2);
    assert.equal(media.activityGallery[0]?.url, "media/venues/school-17/activity-gallery/01.webp");
    assert.equal(media.activityGallery[1]?.url, "media/venues/_default/activity-gallery/01.webp");
  });

  it("falls back to default album when venue album is empty", () => {
    const manifest = manifestWith({
      [`venue-activity:${DEFAULT_SCHOOL_LANDING_SCOPE}:01`]: {
        sourceUrl: "venues/_default/activity-gallery/gallery-01.source.jpg",
        sha256: "d",
        output: "media/venues/_default/activity-gallery/01.webp",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const media = resolveSchoolLandingMedia("school-17", manifest);
    assert.equal(media.activityGallery.length, 1);
    assert.equal(media.videoFileUrl, undefined);
  });

  it("returns empty gallery when venue and default albums are empty", () => {
    const media = resolveSchoolLandingMedia("school-17", manifestWith({}));
    assert.deepEqual(media.activityGallery, []);
  });

  it("falls back video and poster to default scope", () => {
    const manifest = manifestWith({
      [`venue-landing:${DEFAULT_SCHOOL_LANDING_SCOPE}:video`]: {
        sourceUrl: "venues/_default/landing-30s.mp4",
        sha256: "v",
        output: "media/venues/_default/landing-30s.mp4",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      [`venue-landing:${DEFAULT_SCHOOL_LANDING_SCOPE}:poster`]: {
        sourceUrl: "venues/_default/landing-poster.source.jpg",
        sha256: "p",
        output: "media/venues/_default/landing-poster.webp",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const media = resolveSchoolLandingMedia("school-875", manifest);
    assert.match(media.videoFileUrl ?? "", /_default\/landing-30s\.mp4/);
    assert.match(media.videoPosterUrl ?? "", /landing-poster\.webp/);
  });
});
