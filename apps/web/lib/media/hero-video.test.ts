import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  isVideoEmbedUrl,
  isVideoFileUrl,
  normalizeHeroVideo,
  resolveHeroVideoFileUrl,
} from "./hero-video";

describe("isVideoEmbedUrl", () => {
  it("detects VK embed", () => {
    assert.equal(
      isVideoEmbedUrl(
        "https://vk.com/video_ext.php?oid=-221557445&id=456239018",
      ),
      true,
    );
  });
});

describe("isVideoFileUrl", () => {
  it("detects mp4 and media paths", () => {
    assert.equal(
      isVideoFileUrl(
        "https://bm-questhub.s3.twcstorage.ru/media/quests/x/hero.mp4",
      ),
      true,
    );
    assert.equal(isVideoFileUrl("media/quests/cyber-rhythm/hero.mp4"), true);
  });
});

describe("resolveHeroVideoFileUrl", () => {
  const prev = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = prev;
  });

  it("prefixes media path with S3 base", () => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL =
      "https://bm-questhub.s3.twcstorage.ru";
    assert.equal(
      resolveHeroVideoFileUrl("media/quests/cyber-rhythm/hero.mp4"),
      "https://bm-questhub.s3.twcstorage.ru/media/quests/cyber-rhythm/hero.mp4",
    );
  });
});

describe("normalizeHeroVideo", () => {
  const prev = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = "https://example.s3.test";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = prev;
  });

  it("maps legacy heroVideoUrl embed", () => {
    const r = normalizeHeroVideo({
      heroVideoUrl: "https://vk.com/video_ext.php?oid=-1&id=2",
    });
    assert.ok(r.embedUrl?.includes("video_ext"));
    assert.equal(r.fileUrl, undefined);
  });

  it("maps legacy mp4 to file", () => {
    const r = normalizeHeroVideo({
      heroVideoUrl: "media/quests/x/hero.mp4",
    });
    assert.ok(r.fileUrl?.includes("hero.mp4"));
    assert.equal(r.embedUrl, undefined);
  });
});
