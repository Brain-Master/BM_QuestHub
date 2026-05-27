import assert from "node:assert/strict";
import test from "node:test";

import {
  COOKIE_CONSENT_STORAGE_KEY,
  hasAnalyticsConsent,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";

test("cookie consent: essential does not enable analytics", () => {
  const storage = new Map<string, string>();
  const original = globalThis.localStorage;
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      ...globalThis,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
  });

  try {
    writeCookieConsent("essential");
    assert.equal(hasAnalyticsConsent(), false);
    writeCookieConsent("all");
    assert.equal(hasAnalyticsConsent(), true);
    const state = readCookieConsent();
    assert.equal(state?.choice, "all");
    assert.ok(storage.has(COOKIE_CONSENT_STORAGE_KEY));
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: original,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});
