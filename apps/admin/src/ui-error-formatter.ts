import { ApiClientError, type ApiClientErrorCode } from "./api";
import { SnapshotBundleValidationError } from "./snapshot-boundary";

export type UiErrorPresentation = Readonly<{
  text: string;
  correlationId: string | null;
}>;

const MAX_BASE_MESSAGE_LENGTH = 80;
const MAX_PRESENTATION_TEXT_LENGTH = 170;
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

const SECRET_LIKE_PATTERNS = Object.freeze([
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
] as const);

const API_CLIENT_COPY = Object.freeze({
  AUTHENTICATION_REQUIRED: "Требуется повторная авторизация",
  PERMISSION_DENIED: "Недостаточно прав для выполнения операции",
  CONFLICT: "Данные изменились. Обновите снимки и повторите действие",
  VALIDATION_FAILED: "Сервер отклонил данные. Проверьте содержимое",
  SERVER_ERROR: "Сервис временно недоступен. Повторите попытку позже",
  HTTP_ERROR: "Не удалось выполнить запрос",
} as const satisfies Record<ApiClientErrorCode, string>);

const TIMEOUT_COPY = "Сервис не ответил вовремя. Повторите попытку";
const ABORT_COPY = "Запрос отменён";
const SNAPSHOT_COPY = "Получены несовместимые данные. Обновление остановлено";
const SYNTAX_COPY = "Некорректный JSON. Проверьте синтаксис";
const GENERIC_COPY = "Не удалось выполнить операцию";
const CORRELATION_PREFIX = " Код обращения: ";

function isSecretLike(value: string): boolean {
  const lower = value.toLowerCase();
  return SECRET_LIKE_PATTERNS.some((pattern) => lower.includes(pattern));
}

function sanitizeCorrelationId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > 64) return null;
  if (!CORRELATION_ID_PATTERN.test(value)) return null;
  if (isSecretLike(value)) return null;
  return value;
}

function present(base: string, correlationId: string | null): UiErrorPresentation {
  const text =
    correlationId === null ? base : `${base}${CORRELATION_PREFIX}${correlationId}`;

  if (base.length > MAX_BASE_MESSAGE_LENGTH) {
    throw new Error("UI error base message exceeds bound");
  }
  if (text.length > MAX_PRESENTATION_TEXT_LENGTH) {
    throw new Error("UI error presentation exceeds bound");
  }

  return Object.freeze({
    text,
    correlationId,
  });
}

function baseMessageFor(error: unknown): string {
  if (error instanceof ApiClientError) {
    return API_CLIENT_COPY[error.code];
  }

  if (error instanceof SnapshotBundleValidationError) {
    return SNAPSHOT_COPY;
  }

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return TIMEOUT_COPY;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return ABORT_COPY;
  }

  if (error instanceof SyntaxError) {
    return SYNTAX_COPY;
  }

  return GENERIC_COPY;
}

export function formatUiError(error: unknown): UiErrorPresentation {
  const base = baseMessageFor(error);
  const correlationId =
    error instanceof ApiClientError
      ? sanitizeCorrelationId(error.correlationId)
      : null;

  return present(base, correlationId);
}
