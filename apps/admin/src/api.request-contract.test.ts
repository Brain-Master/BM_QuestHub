import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createValidSnapshotBundleFixture } from "./test-fixtures/snapshot-bundle.fixtures";
import { legacyTokenAdapter } from "./legacy-token-adapter";

const API_URL = "https://content-admin.example.test/invoke";
const TOKEN = "test-content-token";
const PRIVATE_BACKEND_MARKER = "SYNTHETIC_PRIVATE_BACKEND_DETAIL_M1_03";

function okSnapshotsResponse() {
  return Response.json(createValidSnapshotBundleFixture());
}

function pendingAbortableFetch() {
  return vi.fn((_url: string, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) {
        reject(new Error("expected AbortSignal"));
        return;
      }
      if (signal.aborted) {
        reject(new DOMException("The operation was aborted.", "AbortError"));
        return;
      }
      signal.addEventListener(
        "abort",
        () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        },
        { once: true },
      );
    });
  });
}

function createCompatibleHeaders(headerInit?: HeadersInit): Headers {
  const map = new Map<string, string>();

  if (headerInit) {
    if (Array.isArray(headerInit)) {
      for (const [key, value] of headerInit) {
        map.set(String(key).toLowerCase(), String(value));
      }
    } else if (headerInit instanceof Headers) {
      headerInit.forEach((value, key) => {
        map.set(key.toLowerCase(), value);
      });
    } else {
      for (const [key, value] of Object.entries(headerInit)) {
        if (value !== undefined) {
          map.set(key.toLowerCase(), String(value));
        }
      }
    }
  }

  return {
    get(name: string) {
      return map.get(name.toLowerCase()) ?? null;
    },
  } as Headers;
}

function nonOkResponse(
  status: number,
  body?: unknown,
  headerInit?: HeadersInit,
) {
  const json = vi.fn(async () => body ?? { error: `status-${status}` });
  return {
    response: {
      ok: false,
      status,
      headers: createCompatibleHeaders(headerInit),
      json,
    } as unknown as Response,
    json,
  };
}

describe("admin API request contracts", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("VITE_CONTENT_ADMIN_URL", API_URL);
    vi.resetModules();

    fetchMock = vi.fn(async () => okSnapshotsResponse());
    vi.stubGlobal("fetch", fetchMock);

    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    });
    legacyTokenAdapter.write(TOKEN);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("routes GET snapshots through query without a request body", async () => {
    const { loadSnapshots } = await import("./api");
    await loadSnapshots();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(API_URL);
    expect(parsed.searchParams.get("path")).toBe("/snapshots");
    expect(init.method).toBe("GET");
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders["content-type"]).toBe("application/json");
    expect(requestHeaders["x-content-token"]).toBe(TOKEN);
    expect(requestHeaders["x-request-id"]).toMatch(
      /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/i,
    );
    expect(requestHeaders["x-correlation-id"]).toBeUndefined();
    expect(Object.keys(requestHeaders).sort()).toEqual(
      ["content-type", "x-content-token", "x-request-id"].sort(),
    );
    expect(Object.prototype.hasOwnProperty.call(init, "body")).toBe(false);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);
  });

  it("preserves the PUT snapshot mutation envelope", async () => {
    const { saveSnapshot } = await import("./api");
    await saveSnapshot("catalog", { title: "Synthetic catalog" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(API_URL);
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(
      JSON.stringify({
        data: { title: "Synthetic catalog" },
        path: "/snapshots/catalog",
      }),
    );
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);
  });

  it("preserves the POST hot sync envelope", async () => {
    const { publishContent } = await import("./api");
    await publishContent("hot");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(API_URL);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ path: "/sync/hot" }));
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);
  });

  it("preserves the POST cold sync envelope", async () => {
    const { publishContent } = await import("./api");
    await publishContent("cold");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(API_URL);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ path: "/sync/cold" }));
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);
  });

  it("maps 401 to an authentication-required client error", async () => {
    const { response, json } = nonOkResponse(401);
    fetchMock.mockResolvedValueOnce(response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "ApiClientError",
      message: "API request failed",
      code: "AUTHENTICATION_REQUIRED",
      status: 401,
    });
    expect((error as Error & { cause?: unknown }).cause).toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it("maps 403 to a permission-denied client error", async () => {
    const { response, json } = nonOkResponse(403);
    fetchMock.mockResolvedValueOnce(response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "ApiClientError",
      message: "API request failed",
      code: "PERMISSION_DENIED",
      status: 403,
    });
    expect(json).not.toHaveBeenCalled();
  });

  it("maps 409 to a conflict client error", async () => {
    const { response, json } = nonOkResponse(409);
    fetchMock.mockResolvedValueOnce(response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "ApiClientError",
      message: "API request failed",
      code: "CONFLICT",
      status: 409,
    });
    expect(json).not.toHaveBeenCalled();
  });

  it("maps 422 without exposing the backend payload", async () => {
    const { response, json } = nonOkResponse(422, {
      error: PRIVATE_BACKEND_MARKER,
      details: { secretLike: PRIVATE_BACKEND_MARKER },
    });
    fetchMock.mockResolvedValueOnce(response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "ApiClientError",
      message: "API request failed",
      code: "VALIDATION_FAILED",
      status: 422,
    });
    expect(json).toHaveBeenCalledTimes(0);
    expect(String(error)).not.toContain(PRIVATE_BACKEND_MARKER);
    expect(JSON.stringify(error)).not.toContain(PRIVATE_BACKEND_MARKER);
    expect(Object.prototype.hasOwnProperty.call(error, "payload")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(error, "details")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(error, "body")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(error, "response")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(error, "raw")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(error, "cause")).toBe(false);
    expect((error as Error & { cause?: unknown }).cause).toBeUndefined();
  });

  it("maps 500 to a server-error client error", async () => {
    const { response, json } = nonOkResponse(500);
    fetchMock.mockResolvedValueOnce(response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "ApiClientError",
      message: "API request failed",
      code: "SERVER_ERROR",
      status: 500,
    });
    expect(json).not.toHaveBeenCalled();
  });

  it("maps 599 to a server-error client error", async () => {
    const { response, json } = nonOkResponse(599);
    fetchMock.mockResolvedValueOnce(response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "ApiClientError",
      message: "API request failed",
      code: "SERVER_ERROR",
      status: 599,
    });
    expect(json).not.toHaveBeenCalled();
  });

  it("maps 404 to a generic HTTP client error", async () => {
    const { response, json } = nonOkResponse(404);
    fetchMock.mockResolvedValueOnce(response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "ApiClientError",
      message: "API request failed",
      code: "HTTP_ERROR",
      status: 404,
    });
    expect(json).not.toHaveBeenCalled();
  });

  it("aborts a pending request at the bounded timeout", async () => {
    vi.useFakeTimers();
    fetchMock = pendingAbortableFetch();
    vi.stubGlobal("fetch", fetchMock);

    const { loadSnapshots, ApiClientError } = await import("./api");
    const pending = loadSnapshots();
    const rejection = expect(pending).rejects.toMatchObject({
      name: "TimeoutError",
      message: "Request timed out",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(14_999);
    expect(init.signal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(init.signal?.aborted).toBe(true);

    await rejection;
    const result = await pending.catch((caught: unknown) => caught);
    expect(result).not.toBeInstanceOf(ApiClientError);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("distinguishes manual cancellation from timeout", async () => {
    vi.useFakeTimers();
    fetchMock = pendingAbortableFetch();
    vi.stubGlobal("fetch", fetchMock);

    const caller = new AbortController();
    const { loadSnapshots, ApiClientError } = await import("./api");
    const pending = loadSnapshots({ signal: caller.signal });
    const rejection = expect(pending).rejects.toMatchObject({
      name: "AbortError",
      message: "Request cancelled",
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal?.aborted).toBe(false);

    caller.abort();
    expect(init.signal?.aborted).toBe(true);

    await rejection;
    const result = await pending.catch((error: unknown) => error);
    expect(result).toMatchObject({
      name: "AbortError",
      message: "Request cancelled",
    });
    expect((result as Error).name).not.toBe("TimeoutError");
    expect(result).not.toBeInstanceOf(ApiClientError);

    await vi.advanceTimersByTimeAsync(15_000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects an already-cancelled request without waiting for timeout", async () => {
    vi.useFakeTimers();
    fetchMock = pendingAbortableFetch();
    vi.stubGlobal("fetch", fetchMock);

    const caller = new AbortController();
    caller.abort();

    const { loadSnapshots, ApiClientError } = await import("./api");
    const pending = loadSnapshots({ signal: caller.signal });
    const rejection = expect(pending).rejects.toMatchObject({
      name: "AbortError",
      message: "Request cancelled",
    });

    await rejection;
    const result = await pending.catch((caught: unknown) => caught);
    expect(result).not.toBeInstanceOf(ApiClientError);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans timeout and abort listeners after settlement", async () => {
    vi.useFakeTimers();
    const caller = new AbortController();
    const { loadSnapshots, ApiClientError } = await import("./api");

    await loadSnapshots({ signal: caller.signal });
    expect(vi.getTimerCount()).toBe(0);
    caller.abort();

    const networkError = new Error("synthetic network failure");
    fetchMock.mockRejectedValueOnce(networkError);
    const secondCaller = new AbortController();
    await expect(
      loadSnapshots({ signal: secondCaller.signal }),
    ).rejects.toBe(networkError);
    expect(networkError).not.toBeInstanceOf(ApiClientError);
    expect(vi.getTimerCount()).toBe(0);
    secondCaller.abort();
  });

  it("rejects a malformed successful snapshot response at the boundary", async () => {
    const marker = "SYNTHETIC_PRIVATE_SNAPSHOT_VALUE_M1_04";
    const malformed = createValidSnapshotBundleFixture() as {
      ok: true;
      catalog: unknown;
      map: Record<string, unknown>;
      site: Record<string, unknown>;
      manifest: null;
      offers: null;
      fixtureMetadata: Record<string, unknown>;
      leak?: string;
    };
    malformed.catalog = [];
    malformed.leak = marker;
    fetchMock.mockResolvedValueOnce(Response.json(malformed));

    const { loadSnapshots, ApiClientError } = await import("./api");
    const { SnapshotBundleValidationError } = await import("./snapshot-boundary");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SnapshotBundleValidationError);
    expect(error).not.toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "SnapshotBundleValidationError",
      message: "Snapshot bundle failed validation",
      code: "SNAPSHOT_BUNDLE_INVALID",
    });
    const issues = (error as InstanceType<typeof SnapshotBundleValidationError>)
      .issues;
    expect(issues.length).toBeLessThanOrEqual(5);
    expect(issues[0]).toEqual({
      path: "$.catalog",
      code: "INVALID_TYPE",
      expected: "object",
    });
    expect(String(error)).not.toContain(marker);
    expect(JSON.stringify(error)).not.toContain(marker);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("path")).toBe("/snapshots");
    expect(init.method).toBe("GET");
    expect(Object.prototype.hasOwnProperty.call(init, "body")).toBe(false);
  });

  it("captures a safe x-request-id without parsing the error body", async () => {
    const correlationId = "req-safe-abc.123:45_67";
    const { response, json } = nonOkResponse(
      500,
      { error: PRIVATE_BACKEND_MARKER },
      { "x-request-id": correlationId },
    );
    fetchMock.mockResolvedValueOnce(response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      name: "ApiClientError",
      message: "API request failed",
      code: "SERVER_ERROR",
      status: 500,
      correlationId,
    });
    expect(json).not.toHaveBeenCalled();
    expect(Object.prototype.hasOwnProperty.call(error, "payload")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(error, "response")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(error, "cause")).toBe(false);
    expect(String(error)).not.toContain(PRIVATE_BACKEND_MARKER);
    expect(JSON.stringify(error)).not.toContain(PRIVATE_BACKEND_MARKER);
  });

  it("uses x-correlation-id only when x-request-id is absent", async () => {
    const fallbackId = "corr-fallback-99";
    const preferredId = "req-preferred-1";

    const fallback = nonOkResponse(
      503,
      { error: PRIVATE_BACKEND_MARKER },
      { "x-correlation-id": fallbackId },
    );
    fetchMock.mockResolvedValueOnce(fallback.response);
    const { loadSnapshots, ApiClientError } = await import("./api");

    const fallbackError = await loadSnapshots().catch(
      (caught: unknown) => caught,
    );
    expect(fallbackError).toBeInstanceOf(ApiClientError);
    expect(fallbackError).toMatchObject({
      code: "SERVER_ERROR",
      status: 503,
      correlationId: fallbackId,
    });
    expect(fallback.json).not.toHaveBeenCalled();

    const both = nonOkResponse(
      404,
      { error: PRIVATE_BACKEND_MARKER },
      {
        "x-request-id": preferredId,
        "x-correlation-id": fallbackId,
      },
    );
    fetchMock.mockResolvedValueOnce(both.response);
    const bothError = await loadSnapshots().catch((caught: unknown) => caught);
    expect(bothError).toBeInstanceOf(ApiClientError);
    expect(bothError).toMatchObject({
      code: "HTTP_ERROR",
      status: 404,
      correlationId: preferredId,
    });
    expect(both.json).not.toHaveBeenCalled();
  });

  it("rejects unsafe correlation headers without leaking them", async () => {
    const unsafeHeaders: Array<Record<string, string>> = [
      { "x-request-id": "bad\nid" },
      { "x-request-id": " has-space" },
      { "x-request-id": "a".repeat(65) },
      { "x-request-id": `token-${PRIVATE_BACKEND_MARKER}` },
      { "x-correlation-id": `secret-${PRIVATE_BACKEND_MARKER}` },
      { "x-request-id": `sk-${PRIVATE_BACKEND_MARKER}` },
    ];

    for (const headers of unsafeHeaders) {
      const { response, json } = nonOkResponse(
        422,
        { error: PRIVATE_BACKEND_MARKER },
        headers,
      );
      fetchMock.mockResolvedValueOnce(response);
      const { loadSnapshots, ApiClientError } = await import("./api");

      const error = await loadSnapshots().catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error).toMatchObject({
        name: "ApiClientError",
        message: "API request failed",
        code: "VALIDATION_FAILED",
        status: 422,
      });
      expect(
        (error as InstanceType<typeof ApiClientError>).correlationId,
      ).toBeUndefined();
      expect(json).not.toHaveBeenCalled();
      expect(String(error)).not.toContain(PRIVATE_BACKEND_MARKER);
      expect(JSON.stringify(error)).not.toContain(PRIVATE_BACKEND_MARKER);
      for (const value of Object.values(headers)) {
        expect(String(error)).not.toContain(value);
        expect(JSON.stringify(error)).not.toContain(value);
      }
    }
  });

  it("sends one safe request ID and emits one successful load observation", async () => {
    const observations: unknown[] = [];
    const requestId = "req-load-success-1";
    const { loadSnapshots } = await import("./api");
    const { API_OPERATIONS } = await import("./api-observability");

    const result = await loadSnapshots({
      observability: {
        createRequestId: () => requestId,
        now: (() => {
          let tick = 1000;
          return () => {
            const value = tick;
            tick += 25;
            return value;
          };
        })(),
        onObservation: (observation) => {
          observations.push(observation);
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders["x-request-id"]).toBe(requestId);
    expect(requestHeaders["x-content-token"]).toBe(TOKEN);
    expect(requestHeaders["content-type"]).toBe("application/json");
    expect(requestHeaders["x-correlation-id"]).toBeUndefined();
    expect(observations).toHaveLength(1);
    expect(observations[0]).toEqual({
      requestId,
      operation: API_OPERATIONS.LOAD_SNAPSHOTS,
      durationMs: 25,
      outcome: "success",
      httpStatus: null,
    });
    expect(Object.keys(observations[0] as object)).toEqual([
      "requestId",
      "operation",
      "durationMs",
      "outcome",
      "httpStatus",
    ]);
  });

  it("uses stable save operation names for every snapshot type", async () => {
    fetchMock.mockImplementation(async () => Response.json({ ok: true }));
    const { saveSnapshot } = await import("./api");
    const { API_OPERATIONS } = await import("./api-observability");

    const cases = [
      ["catalog", API_OPERATIONS.SAVE_CATALOG],
      ["map", API_OPERATIONS.SAVE_MAP],
      ["site", API_OPERATIONS.SAVE_SITE],
      ["manifest", API_OPERATIONS.SAVE_MANIFEST],
      ["offers", API_OPERATIONS.SAVE_OFFERS],
    ] as const;

    for (const [type, operation] of cases) {
      const observations: unknown[] = [];
      await saveSnapshot(type, { title: type }, {
        observability: {
          createRequestId: () => `req-save-${type}`,
          onObservation: (observation) => {
            observations.push(observation);
          },
        },
      });
      expect(observations).toHaveLength(1);
      expect(observations[0]).toMatchObject({
        requestId: `req-save-${type}`,
        operation,
        outcome: "success",
        httpStatus: null,
      });
      const serialized = JSON.stringify(observations[0]);
      expect(serialized).not.toContain(`/snapshots/${type}`);
      expect(serialized).not.toContain("path");
      expect(serialized).not.toContain(API_URL);
    }
  });

  it("uses stable publish operation names for hot and cold", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({ ok: true, tier: "hot" }),
    );
    const { publishContent } = await import("./api");
    const { API_OPERATIONS } = await import("./api-observability");

    for (const [tier, operation] of [
      ["hot", API_OPERATIONS.PUBLISH_HOT],
      ["cold", API_OPERATIONS.PUBLISH_COLD],
    ] as const) {
      const observations: unknown[] = [];
      await publishContent(tier, {
        observability: {
          createRequestId: () => `req-publish-${tier}`,
          onObservation: (observation) => {
            observations.push(observation);
          },
        },
      });
      expect(observations).toHaveLength(1);
      expect(observations[0]).toMatchObject({
        requestId: `req-publish-${tier}`,
        operation,
        outcome: "success",
        httpStatus: null,
      });
      const serialized = JSON.stringify(observations[0]);
      expect(serialized).not.toContain(`/sync/${tier}`);
      expect(serialized).not.toContain(API_URL);
    }
  });

  it("emits an HTTP-error observation without reading body or leaking token", async () => {
    const { response, json } = nonOkResponse(422, {
      error: PRIVATE_BACKEND_MARKER,
      token: TOKEN,
    });
    fetchMock.mockResolvedValueOnce(response);
    const observations: unknown[] = [];
    const { loadSnapshots, ApiClientError } = await import("./api");

    const error = await loadSnapshots({
      observability: {
        createRequestId: () => "req-http-error-1",
        onObservation: (observation) => {
          observations.push(observation);
        },
      },
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(json).not.toHaveBeenCalled();
    expect(observations).toHaveLength(1);
    expect(observations[0]).toEqual({
      requestId: "req-http-error-1",
      operation: "load_snapshots",
      durationMs: expect.any(Number),
      outcome: "http_error",
      httpStatus: 422,
    });
    const serialized = JSON.stringify(observations[0]);
    expect(serialized).not.toContain(PRIVATE_BACKEND_MARKER);
    expect(serialized).not.toContain(TOKEN);
    expect(serialized).not.toContain("x-content-token");
    expect(serialized).not.toContain("body");
    expect(serialized).not.toContain("headers");
    expect(Object.prototype.hasOwnProperty.call(observations[0], "body")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(observations[0], "token")).toBe(
      false,
    );
  });

  it("emits one timeout observation after cleanup", async () => {
    vi.useFakeTimers();
    fetchMock = pendingAbortableFetch();
    vi.stubGlobal("fetch", fetchMock);
    const observations: unknown[] = [];
    const { loadSnapshots, ApiClientError } = await import("./api");

    const pending = loadSnapshots({
      observability: {
        createRequestId: () => "req-timeout-1",
        onObservation: (observation) => {
          observations.push(observation);
        },
      },
    });
    const rejection = expect(pending).rejects.toMatchObject({
      name: "TimeoutError",
      message: "Request timed out",
    });

    await vi.advanceTimersByTimeAsync(15_000);
    await rejection;
    const result = await pending.catch((caught: unknown) => caught);
    expect(result).not.toBeInstanceOf(ApiClientError);
    expect(vi.getTimerCount()).toBe(0);
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      requestId: "req-timeout-1",
      operation: "load_snapshots",
      outcome: "timeout",
      httpStatus: null,
    });
  });

  it("emits one cancellation observation after cleanup", async () => {
    vi.useFakeTimers();
    fetchMock = pendingAbortableFetch();
    vi.stubGlobal("fetch", fetchMock);
    const caller = new AbortController();
    const observations: unknown[] = [];
    const { loadSnapshots, ApiClientError } = await import("./api");

    const pending = loadSnapshots({
      signal: caller.signal,
      observability: {
        createRequestId: () => "req-cancel-1",
        onObservation: (observation) => {
          observations.push(observation);
        },
      },
    });
    const rejection = expect(pending).rejects.toMatchObject({
      name: "AbortError",
      message: "Request cancelled",
    });

    caller.abort();
    await rejection;
    const result = await pending.catch((caught: unknown) => caught);
    expect(result).not.toBeInstanceOf(ApiClientError);
    expect(vi.getTimerCount()).toBe(0);
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      requestId: "req-cancel-1",
      operation: "load_snapshots",
      outcome: "cancelled",
      httpStatus: null,
    });
  });

  it("classifies malformed successful snapshots as invalid-response", async () => {
    const malformed = createValidSnapshotBundleFixture() as {
      ok: true;
      catalog: unknown;
      map: Record<string, unknown>;
      site: Record<string, unknown>;
      manifest: null;
      offers: null;
    };
    malformed.catalog = [];
    fetchMock.mockResolvedValueOnce(Response.json(malformed));
    const observations: unknown[] = [];
    const { loadSnapshots } = await import("./api");
    const { SnapshotBundleValidationError } = await import("./snapshot-boundary");

    const error = await loadSnapshots({
      observability: {
        createRequestId: () => "req-invalid-snapshot-1",
        onObservation: (observation) => {
          observations.push(observation);
        },
      },
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(SnapshotBundleValidationError);
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      requestId: "req-invalid-snapshot-1",
      operation: "load_snapshots",
      outcome: "invalid_response",
      httpStatus: null,
    });
    expect((observations[0] as { outcome: string }).outcome).not.toBe("success");
  });

  it("classifies successful-response JSON parse failures as invalid-response", async () => {
    const json = vi.fn(async () => {
      throw new SyntaxError("Unexpected token");
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: createCompatibleHeaders(),
      json,
    } as unknown as Response);
    const observations: unknown[] = [];
    const { loadSnapshots } = await import("./api");

    const error = await loadSnapshots({
      observability: {
        createRequestId: () => "req-json-syntax-1",
        onObservation: (observation) => {
          observations.push(observation);
        },
      },
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(SyntaxError);
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      requestId: "req-json-syntax-1",
      operation: "load_snapshots",
      outcome: "invalid_response",
      httpStatus: null,
    });
  });

  it("classifies network failures as transport-error and preserves identity", async () => {
    const networkError = new Error("synthetic network failure");
    fetchMock.mockRejectedValueOnce(networkError);
    const observations: unknown[] = [];
    const { loadSnapshots } = await import("./api");

    const error = await loadSnapshots({
      observability: {
        createRequestId: () => "req-transport-1",
        onObservation: (observation) => {
          observations.push(observation);
        },
      },
    }).catch((caught: unknown) => caught);

    expect(error).toBe(networkError);
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      requestId: "req-transport-1",
      operation: "load_snapshots",
      outcome: "transport_error",
      httpStatus: null,
    });
  });

  it("isolates observer clock and request-ID factory failures from operations", async () => {
    const { loadSnapshots } = await import("./api");
    const originalNow = performance.now.bind(performance);
    let defaultClockCalls = 0;

    try {
      // A. Custom clock throws on both reads; success + durationMs 0 + one observation.
      const successObservations: unknown[] = [];
      const success = await loadSnapshots({
        observability: {
          createRequestId: () => {
            throw new Error("factory boom");
          },
          now: () => {
            throw new Error("clock boom");
          },
          onObservation: (observation) => {
            successObservations.push(observation);
            throw new Error("observer boom on success");
          },
        },
      });
      expect(success.ok).toBe(true);
      expect(successObservations).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const successHeaders = fetchMock.mock.calls[0][1] as RequestInit;
      const successRequestId = (
        successHeaders.headers as Record<string, string>
      )["x-request-id"];
      expect(successRequestId).toMatch(
        /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/,
      );
      expect(successRequestId).not.toContain("factory boom");
      expect(successObservations[0]).toMatchObject({
        requestId: successRequestId,
        outcome: "success",
        durationMs: 0,
      });

      // B. Custom clock non-finite (NaN, Infinity) → durationMs 0; one observation each.
      for (const nonFinite of [Number.NaN, Number.POSITIVE_INFINITY]) {
        vi.resetModules();
        const { loadSnapshots: loadWithNonFinite } = await import("./api");
        const nonFiniteObservations: unknown[] = [];
        const nonFiniteResult = await loadWithNonFinite({
          observability: {
            now: () => nonFinite,
            onObservation: (observation) => {
              nonFiniteObservations.push(observation);
            },
          },
        });
        expect(nonFiniteResult.ok).toBe(true);
        expect(nonFiniteObservations).toHaveLength(1);
        expect(nonFiniteObservations[0]).toMatchObject({
          outcome: "success",
          durationMs: 0,
        });
      }

      // C. Default performance.now() throws on success → result preserved, durationMs 0.
      vi.resetModules();
      const { loadSnapshots: loadDefaultSuccess } = await import("./api");
      defaultClockCalls = 0;
      performance.now = () => {
        defaultClockCalls += 1;
        throw new Error("default clock boom");
      };
      const defaultSuccessObservations: unknown[] = [];
      const defaultSuccess = await loadDefaultSuccess({
        observability: {
          onObservation: (observation) => {
            defaultSuccessObservations.push(observation);
          },
        },
      });
      expect(defaultSuccess.ok).toBe(true);
      expect(defaultSuccessObservations).toHaveLength(1);
      expect(defaultClockCalls).toBeGreaterThanOrEqual(2);
      const defaultSuccessHeaders = fetchMock.mock.calls[
        fetchMock.mock.calls.length - 1
      ][1] as RequestInit;
      const defaultSuccessRequestId = (
        defaultSuccessHeaders.headers as Record<string, string>
      )["x-request-id"];
      expect(defaultSuccessObservations[0]).toMatchObject({
        requestId: defaultSuccessRequestId,
        outcome: "success",
        durationMs: 0,
      });

      // Default clock non-finite → durationMs 0.
      for (const nonFinite of [
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
      ]) {
        vi.resetModules();
        const { loadSnapshots: loadDefaultNonFinite } = await import("./api");
        performance.now = () => nonFinite;
        const defaultNonFiniteObservations: unknown[] = [];
        const defaultNonFinite = await loadDefaultNonFinite({
          observability: {
            onObservation: (observation) => {
              defaultNonFiniteObservations.push(observation);
            },
          },
        });
        expect(defaultNonFinite.ok).toBe(true);
        expect(defaultNonFiniteObservations).toHaveLength(1);
        expect(defaultNonFiniteObservations[0]).toMatchObject({
          outcome: "success",
          durationMs: 0,
        });
      }

      // D. Default clock throws on HTTP error → exact original ApiClientError preserved.
      vi.resetModules();
      const {
        loadSnapshots: loadDefaultError,
        ApiClientError: ApiClientErrorReloaded,
      } = await import("./api");
      const { response, json } = nonOkResponse(500, {
        error: PRIVATE_BACKEND_MARKER,
      });
      fetchMock.mockResolvedValueOnce(response);
      performance.now = () => {
        throw new Error("default clock boom on error");
      };
      const defaultErrorObservations: unknown[] = [];
      const error = await loadDefaultError({
        observability: {
          onObservation: (observation) => {
            defaultErrorObservations.push(observation);
          },
        },
      }).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ApiClientErrorReloaded);
      expect(error).toMatchObject({
        code: "SERVER_ERROR",
        status: 500,
      });
      expect((error as Error).message).not.toContain("default clock boom");
      expect(json).not.toHaveBeenCalled();
      expect(defaultErrorObservations).toHaveLength(1);
      expect(defaultErrorObservations[0]).toMatchObject({
        outcome: "http_error",
        httpStatus: 500,
        durationMs: 0,
      });

      // E. Existing factory/observer isolation on failure path.
      performance.now = originalNow;
      vi.resetModules();
      const {
        loadSnapshots: loadFactoryFailure,
        ApiClientError: ApiClientErrorFactory,
      } = await import("./api");
      const unsafe = "token-should-never-appear";
      const failureBody = nonOkResponse(500, {
        error: PRIVATE_BACKEND_MARKER,
      });
      fetchMock.mockResolvedValueOnce(failureBody.response);
      const failureObservations: unknown[] = [];
      const failureError = await loadFactoryFailure({
        observability: {
          createRequestId: () => unsafe,
          onObservation: (observation) => {
            failureObservations.push(observation);
            throw new Error("observer boom on failure");
          },
        },
      }).catch((caught: unknown) => caught);

      expect(failureError).toBeInstanceOf(ApiClientErrorFactory);
      expect(failureBody.json).not.toHaveBeenCalled();
      expect(failureObservations).toHaveLength(1);
      const failureHeaders = fetchMock.mock.calls[
        fetchMock.mock.calls.length - 1
      ][1] as RequestInit;
      const failureRequestId = (
        failureHeaders.headers as Record<string, string>
      )["x-request-id"];
      expect(failureRequestId).not.toBe(unsafe);
      expect(failureRequestId).not.toContain("token");
      expect(String(failureError)).not.toContain(unsafe);
      expect(JSON.stringify(failureObservations[0])).not.toContain(unsafe);
      expect(failureObservations[0]).toMatchObject({
        requestId: failureRequestId,
        outcome: "http_error",
        httpStatus: 500,
      });

      // Failed custom clock must not invoke the default clock.
      defaultClockCalls = 0;
      performance.now = () => {
        defaultClockCalls += 1;
        return 123;
      };
      vi.resetModules();
      const { loadSnapshots: loadCustomNoDefault } = await import("./api");
      const isolatedObservations: unknown[] = [];
      await loadCustomNoDefault({
        observability: {
          now: () => {
            throw new Error("custom only");
          },
          onObservation: (observation) => {
            isolatedObservations.push(observation);
          },
        },
      });
      expect(defaultClockCalls).toBe(0);
      expect(isolatedObservations).toHaveLength(1);
      expect(isolatedObservations[0]).toMatchObject({ durationMs: 0 });
    } finally {
      performance.now = originalNow;
    }
  });
});
