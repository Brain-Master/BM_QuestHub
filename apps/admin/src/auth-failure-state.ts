import { ApiClientError } from "./api";

export type AdminAuthState =
  | { status: "ready" }
  | {
      status: "authentication-required";
      reason: "http-401";
    };

export type AuthFailureTransition = {
  nextAuthState: Extract<
    AdminAuthState,
    { status: "authentication-required" }
  >;
  nextTokenInput: "";
  clearLegacyToken: true;
  preserveEditBuffer: true;
  retry: "manual";
  message: "Требуется повторная авторизация";
};

export const READY_AUTH_STATE: Readonly<AdminAuthState> = Object.freeze({
  status: "ready",
});

const AUTH_FAILURE_TRANSITION: Readonly<AuthFailureTransition> = Object.freeze({
  nextAuthState: Object.freeze({
    status: "authentication-required",
    reason: "http-401",
  } as const),
  nextTokenInput: "",
  clearLegacyToken: true,
  preserveEditBuffer: true,
  retry: "manual",
  message: "Требуется повторная авторизация",
});

export function authFailureTransition(
  error: unknown,
): Readonly<AuthFailureTransition> | null {
  if (
    error instanceof ApiClientError &&
    error.code === "AUTHENTICATION_REQUIRED" &&
    error.status === 401
  ) {
    return AUTH_FAILURE_TRANSITION;
  }
  return null;
}
