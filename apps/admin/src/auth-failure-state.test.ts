import { describe, expect, it } from "vitest";
// Node built-ins are available under Vitest's node environment; @types/node is
// intentionally not an apps/admin dependency (M1-08 forbids lockfile changes).
// @ts-expect-error -- no @types/node in apps/admin
import fs from "node:fs";
// @ts-expect-error -- no @types/node in apps/admin
import path from "node:path";
// @ts-expect-error -- no @types/node in apps/admin
import { fileURLToPath } from "node:url";

import { ApiClientError } from "./api";
import {
  authFailureTransition,
  READY_AUTH_STATE,
  type AuthFailureTransition,
} from "./auth-failure-state";

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

describe("auth failure state contract", () => {
  it("maps an exact 401 ApiClientError to authentication-required", () => {
    const transition = authFailureTransition(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    );
    expect(transition).not.toBeNull();
    expect(transition).toEqual({
      nextAuthState: {
        status: "authentication-required",
        reason: "http-401",
      },
      nextTokenInput: "",
      clearLegacyToken: true,
      preserveEditBuffer: true,
      retry: "manual",
      message: "Требуется повторная авторизация",
    });
    expect(READY_AUTH_STATE).toEqual({ status: "ready" });
    expect(Object.isFrozen(READY_AUTH_STATE)).toBe(true);
  });

  it("ignores non-401 ApiClientError values", () => {
    expect(
      authFailureTransition(new ApiClientError("PERMISSION_DENIED", 403)),
    ).toBeNull();
    expect(
      authFailureTransition(new ApiClientError("SERVER_ERROR", 500)),
    ).toBeNull();
    expect(
      authFailureTransition(new ApiClientError("CONFLICT", 409)),
    ).toBeNull();
    expect(
      authFailureTransition(new ApiClientError("VALIDATION_FAILED", 422)),
    ).toBeNull();
  });

  it("ignores generic and structural lookalike errors", () => {
    expect(authFailureTransition(new Error("API request failed"))).toBeNull();
    expect(authFailureTransition("AUTHENTICATION_REQUIRED")).toBeNull();
    expect(authFailureTransition(null)).toBeNull();
    expect(authFailureTransition(undefined)).toBeNull();
    expect(
      authFailureTransition({
        code: "AUTHENTICATION_REQUIRED",
        status: 401,
        name: "ApiClientError",
        message: "API request failed",
      }),
    ).toBeNull();
  });

  it("clears the token input without carrying secret material", () => {
    const transition = authFailureTransition(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    ) as AuthFailureTransition;
    expect(transition.nextTokenInput).toBe("");

    const allowedKeys = new Set([
      "nextAuthState",
      "nextTokenInput",
      "clearLegacyToken",
      "preserveEditBuffer",
      "retry",
      "message",
    ]);
    for (const key of Object.keys(transition)) {
      expect(allowedKeys.has(key)).toBe(true);
    }

    const secretNeedle =
      /Bearer\s+\S+|x-content-token|contentAdminToken|sk-|ghp_|gho_/i;
    expect(JSON.stringify(transition)).not.toMatch(secretNeedle);
  });

  it("requires clearing the legacy stored token", () => {
    const transition = authFailureTransition(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    );
    expect(transition?.clearLegacyToken).toBe(true);
  });

  it("preserves the non-secret edit buffer contract", () => {
    const transition = authFailureTransition(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    );
    expect(transition?.preserveEditBuffer).toBe(true);
  });

  it("requires manual retry instead of reload", () => {
    const transition = authFailureTransition(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    ) as AuthFailureTransition;
    expect(transition.retry).toBe("manual");
    for (const value of Object.values(transition)) {
      expect(typeof value).not.toBe("function");
    }
    expect(JSON.stringify(transition)).not.toMatch(/reload|retry\(/i);
  });

  it("uses a bounded Russian re-auth message", () => {
    const transition = authFailureTransition(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    );
    expect(transition?.message).toBe("Требуется повторная авторизация");
    expect(transition!.message.length).toBeLessThanOrEqual(80);
  });

  it("returns a deeply frozen deterministic transition", () => {
    const first = authFailureTransition(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    );
    const second = authFailureTransition(
      new ApiClientError("AUTHENTICATION_REQUIRED", 401),
    );
    expect(first).not.toBeNull();
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first!.nextAuthState)).toBe(true);
    expect(second).toEqual(first);
    expect(Object.isFrozen(second)).toBe(true);
    expect(Object.isFrozen(second!.nextAuthState)).toBe(true);
  });

  it("wires App auth failure handling without buffer clearing or reload loops", () => {
    const appSource = fs.readFileSync(path.join(SRC_ROOT, "App.tsx"), "utf8");

    const handlerMatches = appSource.match(
      /const handleRequestError\s*=\s*useCallback/g,
    );
    expect(handlerMatches).toHaveLength(1);

    const handlerStart = appSource.indexOf(
      "const handleRequestError = useCallback",
    );
    expect(handlerStart).toBeGreaterThanOrEqual(0);
    const handlerEnd = appSource.indexOf("}, []);", handlerStart);
    expect(handlerEnd).toBeGreaterThan(handlerStart);
    const handlerBlock = appSource.slice(handlerStart, handlerEnd);

    expect(handlerBlock).toContain("legacyTokenAdapter.clear()");
    expect(handlerBlock).toMatch(/setTokenInput\(/);
    expect(handlerBlock).toMatch(/setAuthState\(/);
    expect(handlerBlock).toMatch(/setStatus\(/);
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
    expect(catchBlocks.length).toBeGreaterThanOrEqual(3);
    const routed = catchBlocks.filter((body) =>
      body.includes("handleRequestError("),
    );
    expect(routed.length).toBe(3);

    const effectMatch = appSource.match(
      /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[([^\]]*)\]\s*\)/,
    );
    expect(effectMatch).not.toBeNull();
    expect(effectMatch![1]).not.toContain("tokenInput");

    const applyTokenMatch = appSource.match(
      /const applyToken\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\};/,
    );
    expect(applyTokenMatch).not.toBeNull();
    const refreshCalls = applyTokenMatch![1].match(/void\s+refresh\(\)/g) ?? [];
    expect(refreshCalls).toHaveLength(1);

    expect(appSource).toContain("data-auth-state={authState.status}");
  });
});
