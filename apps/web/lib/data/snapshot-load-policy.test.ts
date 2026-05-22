import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isNonRetriableFetchError,
  isRetriableFetchError,
} from "./snapshot-load-policy";

describe("snapshot-load-policy", () => {
  it("treats HTTP 403/404 as non-retriable", () => {
    assert.equal(isNonRetriableFetchError("HTTP 403 for https://example/map"), true);
    assert.equal(isNonRetriableFetchError("HTTP 404 for https://example/map"), true);
    assert.equal(isNonRetriableFetchError("fetch failed"), false);
  });

  it("treats generic fetch failed as retriable", () => {
    assert.equal(isRetriableFetchError(new Error("fetch failed")), true);
    assert.equal(
      isRetriableFetchError(new Error("HTTP 403 for https://example/map")),
      false,
    );
  });
});
