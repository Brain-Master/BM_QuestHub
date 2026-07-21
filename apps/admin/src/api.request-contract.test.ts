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

function nonOkResponse(status: number, body?: unknown) {
  const json = vi.fn(async () => body ?? { error: `status-${status}` });
  return {
    response: {
      ok: false,
      status,
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
    expect(init.headers).toEqual({
      "content-type": "application/json",
      "x-content-token": TOKEN,
    });
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
});
