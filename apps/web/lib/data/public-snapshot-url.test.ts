import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  DEFAULT_PUBLIC_S3_BASE_URL,
  publicS3BaseUrl,
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

  it("returns null in production when env is empty", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    assert.equal(publicS3BaseUrl(), null);
  });
});
