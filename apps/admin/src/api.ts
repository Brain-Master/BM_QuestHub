import {
  parseSnapshotsBundle,
  type SnapshotsBundle,
} from "./snapshot-boundary";
import { legacyTokenAdapter } from "./legacy-token-adapter";

export type { SnapshotsBundle } from "./snapshot-boundary";

const API_URL = import.meta.env.VITE_CONTENT_ADMIN_URL?.replace(/\/$/, "") ?? "";

const REQUEST_TIMEOUT_MS = 15_000;

export type ApiRequestOptions = {
  signal?: AbortSignal;
};

export type ApiClientErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "PERMISSION_DENIED"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "SERVER_ERROR"
  | "HTTP_ERROR";

const CORRELATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

const SECRET_LIKE_CORRELATION_PATTERNS = [
  "token",
  "secret",
  "password",
  "authorization",
  "bearer",
  "api-key",
  "api_key",
  "sk-",
  "ghp_",
  "gho_",
  "ghu_",
  "ghs_",
  "ghr_",
] as const;

function isSecretLikeCorrelationId(value: string): boolean {
  const lower = value.toLowerCase();
  return SECRET_LIKE_CORRELATION_PATTERNS.some((pattern) =>
    lower.includes(pattern),
  );
}

function sanitizeCorrelationId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value.length === 0 || value.length > 64) return undefined;
  if (!CORRELATION_ID_PATTERN.test(value)) return undefined;
  if (isSecretLikeCorrelationId(value)) return undefined;
  return value;
}

function readResponseCorrelationId(response: Response): string | undefined {
  const headers = response.headers;
  if (!headers || typeof headers.get !== "function") return undefined;

  for (const name of ["x-request-id", "x-correlation-id"] as const) {
    const sanitized = sanitizeCorrelationId(headers.get(name));
    if (sanitized !== undefined) return sanitized;
  }

  return undefined;
}

export class ApiClientError extends Error {
  readonly name = "ApiClientError";
  readonly correlationId?: string;

  constructor(
    readonly code: ApiClientErrorCode,
    readonly status: number,
    correlationId?: string,
  ) {
    super("API request failed");
    const sanitized = sanitizeCorrelationId(correlationId);
    if (sanitized !== undefined) {
      this.correlationId = sanitized;
    }
  }
}

type AbortCause = "timeout" | "manual";

function headers(): HeadersInit {
  return {
    "content-type": "application/json",
    "x-content-token": legacyTokenAdapter.read(),
  };
}

function requestUrl(method: string, path: string): string {
  if (method !== "GET" && method !== "HEAD") return API_URL;

  const url = new URL(API_URL);
  url.searchParams.set("path", path);
  return url.toString();
}

function apiClientErrorCode(status: number): ApiClientErrorCode {
  if (status === 401) return "AUTHENTICATION_REQUIRED";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_FAILED";
  if (status >= 500 && status <= 599) return "SERVER_ERROR";
  return "HTTP_ERROR";
}

function createRequestAbort(signal?: AbortSignal) {
  const controller = new AbortController();
  let cause: AbortCause | undefined;

  const abort = (nextCause: AbortCause) => {
    if (controller.signal.aborted) return;
    cause = nextCause;
    controller.abort();
  };

  const onManualAbort = () => abort("manual");

  if (signal?.aborted) {
    abort("manual");
  } else {
    signal?.addEventListener("abort", onManualAbort, { once: true });
  }

  const timeoutId = controller.signal.aborted
    ? undefined
    : setTimeout(() => abort("timeout"), REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    cause: () => cause,
    cleanup() {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onManualAbort);
    },
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  if (!API_URL) throw new Error("Задайте VITE_CONTENT_ADMIN_URL");

  const abort = createRequestAbort(options?.signal);

  try {
    const init: RequestInit = {
      method,
      headers: headers(),
      signal: abort.signal,
    };

    if (method !== "GET" && method !== "HEAD") {
      const payload =
        body !== undefined
          ? { ...(typeof body === "object" && body !== null ? body : {}), path }
          : { path };
      init.body = JSON.stringify(payload);
    }

    const res = await fetch(requestUrl(method, path), init);
    if (!res.ok) {
      throw new ApiClientError(
        apiClientErrorCode(res.status),
        res.status,
        readResponseCorrelationId(res),
      );
    }
    return (await res.json()) as T;
  } catch (error) {
    if (abort.signal.aborted) {
      if (abort.cause() === "timeout") {
        throw new DOMException("Request timed out", "TimeoutError");
      }
      if (abort.cause() === "manual") {
        throw new DOMException("Request cancelled", "AbortError");
      }
    }

    throw error;
  } finally {
    abort.cleanup();
  }
}

export async function loadSnapshots(
  options?: ApiRequestOptions,
): Promise<SnapshotsBundle> {
  const response = await request<unknown>(
    "GET",
    "/snapshots",
    undefined,
    options,
  );

  return parseSnapshotsBundle(response);
}

export function saveSnapshot(
  type: "catalog" | "map" | "site" | "manifest" | "offers",
  data: unknown,
  options?: ApiRequestOptions,
) {
  return request<{ ok: boolean }>(
    "PUT",
    `/snapshots/${type}`,
    { data },
    options,
  );
}

export function publishContent(
  tier: "hot" | "cold",
  options?: ApiRequestOptions,
) {
  const path = tier === "hot" ? "/sync/hot" : "/sync/cold";
  return request<{ ok: boolean; tier: string; message?: string; workflow?: unknown }>(
    "POST",
    path,
    {},
    options,
  );
}

export function hasApiUrl() {
  return Boolean(API_URL);
}
