import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { resolvePublicMediaUrl } from "./public-media-url";

describe("resolvePublicMediaUrl", () => {
  const prev = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = prev;
  });

  it("maps legacy /venues/ paths to S3 media/venues/", () => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL =
      "https://bm-quest-s3-hot.s3.twcstorage.ru";
    assert.equal(
      resolvePublicMediaUrl("/venues/logos/school-1517.webp"),
      "https://bm-quest-s3-hot.s3.twcstorage.ru/media/venues/logos/school-1517.webp",
    );
    assert.equal(
      resolvePublicMediaUrl("/venues/photos/school-1212-yasenevo/01.webp"),
      "https://bm-quest-s3-hot.s3.twcstorage.ru/media/venues/photos/school-1212-yasenevo/01.webp",
    );
  });

  it("keeps non-venue site-relative paths", () => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL =
      "https://bm-quest-s3-hot.s3.twcstorage.ru";
    assert.equal(resolvePublicMediaUrl("/brand/foo.webp"), "/brand/foo.webp");
  });

  it("prefixes media/ with S3 base", () => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL =
      "https://bm-quest-s3-hot.s3.twcstorage.ru";
    assert.equal(
      resolvePublicMediaUrl("media/quests/cyber-rhythm/hero.webp"),
      "https://bm-quest-s3-hot.s3.twcstorage.ru/media/quests/cyber-rhythm/hero.webp",
    );
  });

  it("maps legacy schedule paths with colons to __ storage keys", () => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL =
      "https://bm-quest-s3-hot.s3.twcstorage.ru";
    assert.equal(
      resolvePublicMediaUrl(
        "media/schedule/cyber-rhythm:school-17:2026-06-22:2026-06-26/hero.webp",
      ),
      "https://bm-quest-s3-hot.s3.twcstorage.ru/media/schedule/cyber-rhythm__school-17__2026-06-22__2026-06-26/hero.webp",
    );
  });

  it("leaves absolute URLs unchanged", () => {
    assert.equal(
      resolvePublicMediaUrl("https://cdn.example/x.webp"),
      "https://cdn.example/x.webp",
    );
  });
});
