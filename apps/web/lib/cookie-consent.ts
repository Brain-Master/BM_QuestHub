export const COOKIE_CONSENT_STORAGE_KEY = "bm.cookieConsent.v1";

export const COOKIE_CONSENT_CHANGED_EVENT = "bm:cookie-consent-changed";

export type CookieConsentChoice = "all" | "essential";

export type CookieConsentState = {
  choice: CookieConsentChoice;
  updatedAt: string;
};

function isChoice(value: unknown): value is CookieConsentChoice {
  return value === "all" || value === "essential";
}

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !isChoice((parsed as CookieConsentState).choice) ||
      typeof (parsed as CookieConsentState).updatedAt !== "string"
    ) {
      return null;
    }
    return parsed as CookieConsentState;
  } catch {
    return null;
  }
}

export function writeCookieConsent(choice: CookieConsentChoice): CookieConsentState {
  const state: CookieConsentState = {
    choice,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT));
  }
  return state;
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.choice === "all";
}

export function hasCookieConsentChoice(): boolean {
  return readCookieConsent() !== null;
}

export function subscribeCookieConsent(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, handler);
  return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, handler);
}
