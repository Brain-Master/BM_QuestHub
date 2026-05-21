import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { resolvePublicMediaUrl } from "./public-media-url";

describe("resolvePublicMediaUrl", () => {
  const prev = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = prev;
  });

  it("keeps site-relative public paths", () => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL =
      "https://bm-questhub.s3.twcstorage.ru";
    assert.equal(
      resolvePublicMediaUrl("/venues/logos/school-1517.webp"),
      "/venues/logos/school-1517.webp",
    );
  });

  it("prefixes media/ with S3 base", () => {
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL =
      "https://bm-questhub.s3.twcstorage.ru";
    assert.equal(
      resolvePublicMediaUrl("media/quests/cyber-rhythm/hero.webp"),
      "https://bm-questhub.s3.twcstorage.ru/media/quests/cyber-rhythm/hero.webp",
    );
  });

  it("leaves absolute URLs unchanged", () => {
    assert.equal(
      resolvePublicMediaUrl("https://cdn.example/x.webp"),
      "https://cdn.example/x.webp",
    );
  });
});
