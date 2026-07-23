export const API_OPERATIONS = Object.freeze({
  LOAD_SNAPSHOTS: "load_snapshots",
  SAVE_CATALOG: "save_catalog",
  SAVE_MAP: "save_map",
  SAVE_SITE: "save_site",
  SAVE_MANIFEST: "save_manifest",
  SAVE_OFFERS: "save_offers",
  PUBLISH_HOT: "publish_hot",
  PUBLISH_COLD: "publish_cold",
} as const);

export type ApiOperation =
  (typeof API_OPERATIONS)[keyof typeof API_OPERATIONS];

export type ApiRequestOutcome =
  | "success"
  | "http_error"
  | "timeout"
  | "cancelled"
  | "invalid_response"
  | "transport_error";

export type ApiRequestObservation = Readonly<{
  requestId: string;
  operation: ApiOperation;
  durationMs: number;
  outcome: ApiRequestOutcome;
  httpStatus: number | null;
}>;

export type CreateApiRequestObservationInput = Readonly<{
  requestId: string;
  operation: ApiOperation;
  startedAt: number;
  endedAt: number;
  outcome: ApiRequestOutcome;
  httpStatus?: number | null;
}>;

export type ApiObserver = (observation: ApiRequestObservation) => void;

export type ApiObservabilityOptions = Readonly<{
  onObservation?: ApiObserver;
  now?: () => number;
  createRequestId?: () => string;
}>;

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

const SECRET_LIKE_REQUEST_ID_PATTERNS = [
  "token",
  "secret",
  "password",
  ["author", "ization"].join(""),
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

function isSecretLikeRequestId(value: string): boolean {
  const lower = value.toLowerCase();
  return SECRET_LIKE_REQUEST_ID_PATTERNS.some((pattern) =>
    lower.includes(pattern),
  );
}

export function sanitizeApiRequestId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!REQUEST_ID_PATTERN.test(value)) return null;
  if (isSecretLikeRequestId(value)) return null;
  return value;
}

export function normalizeApiDurationMs(
  startedAt: number,
  endedAt: number,
): number {
  const diff = endedAt - startedAt;
  if (!Number.isFinite(diff)) return 0;
  const rounded = Math.round(diff);
  if (!Number.isFinite(rounded) || rounded < 0) return 0;
  return rounded;
}

export function createApiRequestObservation(
  input: CreateApiRequestObservationInput,
): ApiRequestObservation {
  const requestId = sanitizeApiRequestId(input.requestId);
  if (requestId === null) {
    throw new Error("Invalid API request ID");
  }

  let httpStatus: number | null = null;
  if (input.outcome === "http_error") {
    const status = input.httpStatus;
    if (
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 100 &&
      status <= 599
    ) {
      httpStatus = status;
    }
  }

  return Object.freeze({
    requestId,
    operation: input.operation,
    durationMs: normalizeApiDurationMs(input.startedAt, input.endedAt),
    outcome: input.outcome,
    httpStatus,
  });
}
