import { describe, expect, it } from "vitest";
// Node built-ins are available under Vitest's node environment; @types/node is
// intentionally not an apps/admin dependency (M1-10 forbids lockfile changes).
// @ts-expect-error -- no @types/node in apps/admin
import fs from "node:fs";
// @ts-expect-error -- no @types/node in apps/admin
import path from "node:path";
// @ts-expect-error -- no @types/node in apps/admin
import { fileURLToPath } from "node:url";

import { ApiClientError } from "./api";
import { SnapshotBundleValidationError } from "./snapshot-boundary";
import { formatUiError } from "./ui-error-formatter";

const SRC_ROOT = path.dirname(fileURLToPath(import.meta.url));
const PRIVATE_MARKER = "SYNTHETIC_PRIVATE_UI_ERROR_MARKER_M1_10";

const COPY = {
  AUTHENTICATION_REQUIRED: "Требуется повторная авторизация",
  PERMISSION_DENIED: "Недостаточно прав для выполнения операции",
  CONFLICT: "Данные изменились. Обновите снимки и повторите действие",
  VALIDATION_FAILED: "Сервер отклонил данные. Проверьте содержимое",
  SERVER_ERROR: "Сервис временно недоступен. Повторите попытку позже",
  HTTP_ERROR: "Не удалось выполнить запрос",
  TIMEOUT: "Сервис не ответил вовремя. Повторите попытку",
  ABORT: "Запрос отменён",
  SNAPSHOT: "Получены несовместимые данные. Обновление остановлено",
  SYNTAX: "Некорректный JSON. Проверьте синтаксис",
  GENERIC: "Не удалось выполнить операцию",
} as const;

describe("safe admin UI error formatter", () => {
  it("maps authentication-required client errors to safe Russian copy", () => {
    const presentation = formatUiError(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    );
    expect(presentation).toEqual({
      text: COPY.AUTHENTICATION_REQUIRED,
      correlationId: null,
    });
  });

  it("maps permission-denied client errors to safe Russian copy", () => {
    const presentation = formatUiError(
      new ApiClientError("PERMISSION_DENIED", 403),
    );
    expect(presentation).toEqual({
      text: COPY.PERMISSION_DENIED,
      correlationId: null,
    });
  });

  it("maps conflict client errors to safe Russian copy", () => {
    const presentation = formatUiError(new ApiClientError("CONFLICT", 409));
    expect(presentation).toEqual({
      text: COPY.CONFLICT,
      correlationId: null,
    });
  });

  it("maps validation client errors to safe Russian copy", () => {
    const presentation = formatUiError(
      new ApiClientError("VALIDATION_FAILED", 422),
    );
    expect(presentation).toEqual({
      text: COPY.VALIDATION_FAILED,
      correlationId: null,
    });
  });

  it("maps server client errors to safe Russian copy", () => {
    expect(formatUiError(new ApiClientError("SERVER_ERROR", 500))).toEqual({
      text: COPY.SERVER_ERROR,
      correlationId: null,
    });
    expect(formatUiError(new ApiClientError("SERVER_ERROR", 599))).toEqual({
      text: COPY.SERVER_ERROR,
      correlationId: null,
    });
  });

  it("maps generic HTTP client errors to safe Russian copy", () => {
    const presentation = formatUiError(new ApiClientError("HTTP_ERROR", 404));
    expect(presentation).toEqual({
      text: COPY.HTTP_ERROR,
      correlationId: null,
    });
  });

  it("maps timeout errors without exposing their raw message", () => {
    const error = new DOMException("Request timed out", "TimeoutError");
    const presentation = formatUiError(error);
    expect(presentation).toEqual({
      text: COPY.TIMEOUT,
      correlationId: null,
    });
    expect(presentation.text).not.toContain("Request timed out");
  });

  it("maps cancellation errors without exposing their raw message", () => {
    const error = new DOMException("Request cancelled", "AbortError");
    const presentation = formatUiError(error);
    expect(presentation).toEqual({
      text: COPY.ABORT,
      correlationId: null,
    });
    expect(presentation.text).not.toContain("Request cancelled");
  });

  it("maps snapshot boundary errors without exposing issues", () => {
    const error = new SnapshotBundleValidationError([
      {
        path: "$.catalog",
        code: "INVALID_TYPE",
        expected: "object",
      },
    ]);
    const presentation = formatUiError(error);
    expect(presentation).toEqual({
      text: COPY.SNAPSHOT,
      correlationId: null,
    });
    expect(presentation.text).not.toContain("$.catalog");
    expect(presentation.text).not.toContain("INVALID_TYPE");
    expect(JSON.stringify(presentation)).not.toContain("issues");
  });

  it("maps JSON syntax errors without exposing parser fragments", () => {
    let syntaxError: SyntaxError;
    try {
      JSON.parse("{");
      throw new Error("expected SyntaxError");
    } catch (caught) {
      syntaxError = caught as SyntaxError;
    }
    const presentation = formatUiError(syntaxError!);
    expect(presentation).toEqual({
      text: COPY.SYNTAX,
      correlationId: null,
    });
    expect(presentation.text).not.toContain(syntaxError!.message);
    expect(presentation.text).not.toMatch(/Unexpected|position \d+/i);
  });

  it("maps generic errors and non-error values to one safe fallback", () => {
    const values: unknown[] = [
      new Error(PRIVATE_MARKER),
      new TypeError(PRIVATE_MARKER),
      PRIVATE_MARKER,
      { message: PRIVATE_MARKER, code: "PERMISSION_DENIED" },
      null,
      undefined,
      Symbol(PRIVATE_MARKER),
    ];

    for (const value of values) {
      const presentation = formatUiError(value);
      expect(presentation).toEqual({
        text: COPY.GENERIC,
        correlationId: null,
      });
      expect(presentation.text).not.toContain(PRIVATE_MARKER);
    }
  });

  it("appends a sanitized correlation ID to client error copy", () => {
    const correlationId = "req-abc123.DEF:45_67";
    const presentation = formatUiError(
      new ApiClientError("HTTP_ERROR", 404, correlationId),
    );
    expect(presentation).toEqual({
      text: `${COPY.HTTP_ERROR} Код обращения: ${correlationId}`,
      correlationId,
    });
  });

  it("omits unsafe or oversized correlation IDs", () => {
    const unsafeValues = [
      " has-space",
      "has\nnewline",
      "a".repeat(65),
      "token-value-1",
      "x-secret-id",
      "password123",
      "authorization-1",
      "bearer-xyz",
      "api-key-1",
      "api_key_1",
      "sk-live-abc",
      "ghp_forged",
      "gho_forged",
      "ghu_forged",
      "ghs_forged",
      "ghr_forged",
    ];

    for (const unsafe of unsafeValues) {
      const presentation = formatUiError(
        new ApiClientError("SERVER_ERROR", 500, unsafe),
      );
      expect(presentation).toEqual({
        text: COPY.SERVER_ERROR,
        correlationId: null,
      });
      expect(presentation.text).not.toContain(unsafe);
    }

    const forged = new ApiClientError("CONFLICT", 409, "safe-id-1");
    Object.defineProperty(forged, "correlationId", {
      value: "token-forged",
      configurable: true,
    });
    const forgedPresentation = formatUiError(forged);
    expect(forgedPresentation).toEqual({
      text: COPY.CONFLICT,
      correlationId: null,
    });
    expect(forgedPresentation.text).not.toContain("token-forged");
  });

  it("never exposes raw message stack cause payload or structural fields", () => {
    const error = new ApiClientError("VALIDATION_FAILED", 422, "corr-safe-1");
    Object.defineProperty(error, "message", {
      value: PRIVATE_MARKER,
      configurable: true,
    });
    Object.defineProperty(error, "stack", {
      value: `Error: ${PRIVATE_MARKER}\n    at test`,
      configurable: true,
    });
    Object.defineProperty(error, "cause", {
      value: { detail: PRIVATE_MARKER },
      configurable: true,
    });
    Object.defineProperty(error, "payload", {
      value: { nested: { secret: PRIVATE_MARKER } },
      configurable: true,
    });

    const presentation = formatUiError(error);
    expect(presentation.text).toBe(
      `${COPY.VALIDATION_FAILED} Код обращения: corr-safe-1`,
    );
    expect(presentation.text).not.toContain(PRIVATE_MARKER);
    expect(JSON.stringify(presentation)).not.toContain(PRIVATE_MARKER);
    expect(Object.keys(presentation).sort()).toEqual([
      "correlationId",
      "text",
    ]);
    expect(
      Object.prototype.hasOwnProperty.call(presentation, "message"),
    ).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(presentation, "stack")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(presentation, "cause")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(presentation, "payload")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(presentation, "code")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(presentation, "status")).toBe(
      false,
    );
  });

  it("returns a frozen deterministic bounded presentation", () => {
    const error = new ApiClientError("PERMISSION_DENIED", 403, "id-42");
    const first = formatUiError(error);
    const second = formatUiError(error);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.keys(first)).toEqual(["text", "correlationId"]);
    expect(first.text.length).toBeLessThanOrEqual(170);
    expect(COPY.PERMISSION_DENIED.length).toBeLessThanOrEqual(80);
    expect(() => {
      (first as { text: string }).text = "mutated";
    }).toThrow();
  });

  it("wires App non-auth errors through the safe formatter", () => {
    const appSource = fs.readFileSync(path.join(SRC_ROOT, "App.tsx"), "utf8");

    expect(appSource).toContain(
      'import { formatUiError } from "./ui-error-formatter";',
    );
    expect(appSource).toContain("formatUiError(error)");

    const handlerStart = appSource.indexOf(
      "const handleRequestError = useCallback",
    );
    expect(handlerStart).toBeGreaterThanOrEqual(0);
    const handlerEnd = appSource.indexOf("}, []);", handlerStart);
    expect(handlerEnd).toBeGreaterThan(handlerStart);
    const handlerBlock = appSource.slice(handlerStart, handlerEnd);

    const authIndex = handlerBlock.indexOf("authFailureTransition(error)");
    const formatterIndex = handlerBlock.indexOf("formatUiError(error)");
    expect(authIndex).toBeGreaterThanOrEqual(0);
    expect(formatterIndex).toBeGreaterThan(authIndex);
    expect(handlerBlock).toMatch(/if\s*\(\s*transition\s*\)\s*\{/);
    expect(handlerBlock).toContain("return;");
    expect(handlerBlock).toContain("setStatus(formatUiError(error).text)");
    expect(handlerBlock).not.toContain("error.message");
    expect(handlerBlock).not.toContain("String(error)");
    expect(handlerBlock).not.toContain("error.stack");
    expect(handlerBlock).not.toContain("error.cause");
    expect(handlerBlock).not.toContain("JSON.stringify(error)");
    expect(handlerBlock).not.toContain("setCatalogJson");
    expect(handlerBlock).not.toContain("setMapJson");
    expect(handlerBlock).not.toContain("setSiteJson");
    expect(handlerBlock).not.toContain("setOffersJson");
    expect(handlerBlock).not.toMatch(/refresh\(/);
    expect(handlerBlock).not.toContain("location.reload");
    expect(handlerBlock).not.toContain("setTimeout");
    expect(handlerBlock).not.toContain("setInterval");

    const catchBlocks = [
      ...appSource.matchAll(/catch\s*\([^)]*\)\s*\{([^}]*)\}/g),
    ].map((m) => m[1]);
    const routed = catchBlocks.filter((body) =>
      body.includes("handleRequestError("),
    );
    expect(routed.length).toBe(3);
  });
});
