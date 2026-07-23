import { describe, expect, it } from "vitest";
// Node built-ins are available under Vitest's node environment; @types/node is
// intentionally not an apps/admin dependency (M1-11 forbids lockfile changes).
// @ts-expect-error -- no @types/node in apps/admin
import { readFileSync } from "node:fs";
// @ts-expect-error -- no @types/node in apps/admin
import { dirname, join } from "node:path";
// @ts-expect-error -- no @types/node in apps/admin
import { fileURLToPath } from "node:url";

import {
  API_OPERATIONS,
  createApiRequestObservation,
  normalizeApiDurationMs,
  sanitizeApiRequestId,
  type ApiRequestObservation,
} from "./api-observability";

const MODULE_SOURCE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "api-observability.ts"),
  "utf8",
);

const FORBIDDEN_SOURCE_MARKERS = [
  "console.",
  "fetch(",
  "sessionStorage",
  "localStorage",
  "document.",
  "window.",
  "process.env",
  "setTimeout",
  "setInterval",
  "x-content-token",
  "authorization",
] as const;

const FORBIDDEN_EVENT_KEYS = [
  "method",
  "path",
  "url",
  "query",
  "headers",
  "body",
  "payload",
  "data",
  "token",
  "authorization",
  "correlationId",
  "message",
  "error",
  "errorName",
  "errorCode",
  "stack",
  "cause",
  "response",
  "issues",
  "raw",
  "timestamp",
  "startedAt",
  "endedAt",
] as const;

function assertStableObservationShape(observation: ApiRequestObservation) {
  expect(Object.isFrozen(observation)).toBe(true);
  expect(Object.keys(observation)).toEqual([
    "requestId",
    "operation",
    "durationMs",
    "outcome",
    "httpStatus",
  ]);
  for (const key of FORBIDDEN_EVENT_KEYS) {
    expect(Object.prototype.hasOwnProperty.call(observation, key)).toBe(false);
  }
}

describe("admin API observability contract", () => {
  it("exposes a frozen stable operation vocabulary", () => {
    expect(Object.isFrozen(API_OPERATIONS)).toBe(true);
    expect(API_OPERATIONS).toEqual({
      LOAD_SNAPSHOTS: "load_snapshots",
      SAVE_CATALOG: "save_catalog",
      SAVE_MAP: "save_map",
      SAVE_SITE: "save_site",
      SAVE_MANIFEST: "save_manifest",
      SAVE_OFFERS: "save_offers",
      PUBLISH_HOT: "publish_hot",
      PUBLISH_COLD: "publish_cold",
    });
    expect(Object.values(API_OPERATIONS)).toEqual([
      "load_snapshots",
      "save_catalog",
      "save_map",
      "save_site",
      "save_manifest",
      "save_offers",
      "publish_hot",
      "publish_cold",
    ]);
  });

  it("accepts bounded non-secret request IDs", () => {
    expect(sanitizeApiRequestId("a")).toBe("a");
    expect(sanitizeApiRequestId("req-safe.abc:123_45")).toBe(
      "req-safe.abc:123_45",
    );
    expect(sanitizeApiRequestId("A".repeat(64))).toBe("A".repeat(64));
    expect(
      sanitizeApiRequestId("550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects unsafe secret-like or malformed request IDs", () => {
    const rejected = [
      "",
      " has-space",
      "bad\nid",
      "a".repeat(65),
      "token-abc",
      "secret-xyz",
      "password1",
      "authorization-hdr",
      "bearer-xyz",
      "api-key-1",
      "api_key_1",
      "sk-live",
      "ghp_abc",
      "gho_abc",
      "ghu_abc",
      "ghs_abc",
      "ghr_abc",
      42,
      null,
      undefined,
      { id: "x" },
      "  trimmed  ",
    ];

    for (const value of rejected) {
      expect(sanitizeApiRequestId(value)).toBeNull();
    }
  });

  it("normalizes finite durations to non-negative integers", () => {
    expect(normalizeApiDurationMs(10, 10.4)).toBe(0);
    expect(normalizeApiDurationMs(10, 10.6)).toBe(1);
    expect(normalizeApiDurationMs(100, 250.2)).toBe(150);
    expect(normalizeApiDurationMs(50, 40)).toBe(0);
  });

  it("normalizes non-finite duration inputs to zero", () => {
    expect(normalizeApiDurationMs(Number.NaN, 10)).toBe(0);
    expect(normalizeApiDurationMs(0, Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeApiDurationMs(Number.NEGATIVE_INFINITY, 0)).toBe(0);
    expect(normalizeApiDurationMs(0, Number.NaN)).toBe(0);
  });

  it("creates a frozen success observation with exact stable fields", () => {
    const observation = createApiRequestObservation({
      requestId: "req-success-1",
      operation: API_OPERATIONS.LOAD_SNAPSHOTS,
      startedAt: 1000,
      endedAt: 1125.4,
      outcome: "success",
      httpStatus: 200,
    });

    assertStableObservationShape(observation);
    expect(observation).toEqual({
      requestId: "req-success-1",
      operation: "load_snapshots",
      durationMs: 125,
      outcome: "success",
      httpStatus: null,
    });
  });

  it("retains HTTP status only for http-error observations", () => {
    const httpError = createApiRequestObservation({
      requestId: "req-http-422",
      operation: API_OPERATIONS.SAVE_CATALOG,
      startedAt: 0,
      endedAt: 10,
      outcome: "http_error",
      httpStatus: 422,
    });
    expect(httpError.httpStatus).toBe(422);

    const outOfRange = createApiRequestObservation({
      requestId: "req-http-bad",
      operation: API_OPERATIONS.SAVE_CATALOG,
      startedAt: 0,
      endedAt: 10,
      outcome: "http_error",
      httpStatus: 99,
    });
    expect(outOfRange.httpStatus).toBeNull();

    for (const outcome of [
      "success",
      "timeout",
      "cancelled",
      "invalid_response",
      "transport_error",
    ] as const) {
      const observation = createApiRequestObservation({
        requestId: `req-${outcome}`,
        operation: API_OPERATIONS.PUBLISH_HOT,
        startedAt: 0,
        endedAt: 5,
        outcome,
        httpStatus: 500,
      });
      expect(observation.httpStatus).toBeNull();
    }
  });

  it("rejects unsafe request IDs without embedding them in the error", () => {
    const unsafe = "token-leaked-value";
    expect(() =>
      createApiRequestObservation({
        requestId: unsafe,
        operation: API_OPERATIONS.LOAD_SNAPSHOTS,
        startedAt: 0,
        endedAt: 1,
        outcome: "success",
      }),
    ).toThrowError(new Error("Invalid API request ID"));

    try {
      createApiRequestObservation({
        requestId: unsafe,
        operation: API_OPERATIONS.LOAD_SNAPSHOTS,
        startedAt: 0,
        endedAt: 1,
        outcome: "success",
      });
      expect.unreachable("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Invalid API request ID");
      expect(String(error)).not.toContain(unsafe);
      expect(JSON.stringify(error)).not.toContain(unsafe);
    }
  });

  it("never carries body token headers URL or error detail fields", () => {
    const observation = createApiRequestObservation({
      requestId: "req-redact-1",
      operation: API_OPERATIONS.SAVE_MAP,
      startedAt: 1,
      endedAt: 2,
      outcome: "http_error",
      httpStatus: 401,
    });

    assertStableObservationShape(observation);
    const serialized = JSON.stringify(observation);
    for (const marker of [
      "body",
      "token",
      "headers",
      "url",
      "path",
      "authorization",
      "stack",
      "cause",
      "message",
      "response",
      "payload",
    ]) {
      expect(serialized).not.toContain(`"${marker}"`);
    }
  });

  it("serializes without private request or response markers", () => {
    const observation = createApiRequestObservation({
      requestId: "req-serialize-1",
      operation: API_OPERATIONS.PUBLISH_COLD,
      startedAt: 10,
      endedAt: 40,
      outcome: "transport_error",
    });

    const serialized = JSON.stringify(observation);
    expect(serialized).toBe(
      JSON.stringify({
        requestId: "req-serialize-1",
        operation: "publish_cold",
        durationMs: 30,
        outcome: "transport_error",
        httpStatus: null,
      }),
    );
    expect(serialized).not.toContain("SYNTHETIC_PRIVATE");
    expect(serialized).not.toContain("x-content-token");
    expect(serialized).not.toContain("/snapshots");
    expect(serialized).not.toContain("https://");
  });

  it("creates deterministic observations for identical inputs", () => {
    const input = {
      requestId: "req-deterministic",
      operation: API_OPERATIONS.SAVE_OFFERS,
      startedAt: 200,
      endedAt: 455.6,
      outcome: "success" as const,
    };
    const first = createApiRequestObservation(input);
    const second = createApiRequestObservation(input);
    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("keeps the observability module free of logging and side effects", () => {
    for (const marker of FORBIDDEN_SOURCE_MARKERS) {
      expect(MODULE_SOURCE).not.toContain(marker);
    }
  });
});
