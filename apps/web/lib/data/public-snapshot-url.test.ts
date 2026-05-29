import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  DEFAULT_PUBLIC_S3_BASE_URL,
  publicS3BaseUrl,
  resolvePublicSnapshotUrl,
  snapshotBaseUrlFromManifest,
} from "./public-snapshot-url";

describe("publicS3BaseUrl", () => {
  const prevEnv = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (prevEnv === undefined) delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = prevEnv;
    process.env.NODE_ENV = prevNodeEnv;
  });

  it("prefers NEXT_PUBLIC_S3_PUBLIC_BASE_URL when set", () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = "https://custom.example";
    assert.equal(publicS3BaseUrl(), "https://custom.example");
  });

  it("falls back to default bucket in development when env is empty", () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    assert.equal(publicS3BaseUrl(), DEFAULT_PUBLIC_S3_BASE_URL);
  });

  it("falls back to default bucket in production when env is empty", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    assert.equal(publicS3BaseUrl(), DEFAULT_PUBLIC_S3_BASE_URL);
  });
});

describe("snapshotBaseUrlFromManifest", () => {
  it("extracts bucket root from path-style manifest URL", () => {
    assert.equal(
      snapshotBaseUrlFromManifest(
        "https://storage.yandexcloud.net/bm-questhub/data/v2/site-manifest.json",
      ),
      "https://storage.yandexcloud.net/bm-questhub/",
    );
  });
});

describe("resolvePublicSnapshotUrl", () => {
  const manifestUrl =
    "https://storage.yandexcloud.net/bm-questhub/data/v2/site-manifest.json";
  const mapPath = "data/v2/map-snapshot.json";
  const expected =
    "https://storage.yandexcloud.net/bm-questhub/data/v2/map-snapshot.json";

  const prevS3 = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
  const prevSource = process.env.SITE_SNAPSHOT_SOURCE;
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (prevS3 === undefined) delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = prevS3;
    if (prevSource === undefined) delete process.env.SITE_SNAPSHOT_SOURCE;
    else process.env.SITE_SNAPSHOT_SOURCE = prevSource;
    process.env.NODE_ENV = prevNodeEnv;
  });

  it("does not append snapshot path after site-manifest.json filename", () => {
    process.env.NODE_ENV = "development";
    process.env.SITE_SNAPSHOT_SOURCE = "s3";
    delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;

    const url = resolvePublicSnapshotUrl(mapPath, { manifestUrl });
    assert.equal(url, expected);
    assert.ok(!url?.includes("site-manifest.json/data"));
  });

  it("uses NEXT_PUBLIC_S3_PUBLIC_BASE_URL when set with manifestUrl", () => {
    process.env.NODE_ENV = "production";
    process.env.SITE_SNAPSHOT_SOURCE = "s3";
    process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL =
      "https://storage.yandexcloud.net/bm-questhub";

    const url = resolvePublicSnapshotUrl(mapPath, { manifestUrl });
    assert.equal(url, expected);
  });

  it("returns null without manifestUrl when SITE_SNAPSHOT_SOURCE is not s3", () => {
    process.env.NODE_ENV = "development";
    delete process.env.SITE_SNAPSHOT_SOURCE;
    delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;

    assert.equal(resolvePublicSnapshotUrl(mapPath), null);
  });
});
