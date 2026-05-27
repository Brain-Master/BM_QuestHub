"use client";

import * as React from "react";

import { AnalyticsVisitScope } from "@/components/analytics-visit-scope";
import { YandexMetrika } from "@/components/yandex-metrika";
import {
  hasAnalyticsConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";

/** Loads Yandex Metrika and visit params only after analytics cookie consent. */
export function ConsentGatedAnalytics() {
  const [analyticsAllowed, setAnalyticsAllowed] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setAnalyticsAllowed(hasAnalyticsConsent());
    sync();
    return subscribeCookieConsent(sync);
  }, []);

  if (!analyticsAllowed) return null;

  return (
    <>
      <AnalyticsVisitScope />
      <YandexMetrika />
    </>
  );
}
