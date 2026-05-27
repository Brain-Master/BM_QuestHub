"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  hasCookieConsentChoice,
  subscribeCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";
import { LEGAL_COOKIES_ANALYTICS_PATH } from "@/lib/legal-routes";
import { cn } from "@/lib/utils";

export function CookieConsentBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setVisible(!hasCookieConsentChoice());
    sync();
    return subscribeCookieConsent(sync);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      data-testid="cookie-consent-banner"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[100] border-white/10 border-t bg-[#0a0f1c]/95 p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md",
        "md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md md:rounded-2xl md:border",
      )}
    >
      <p id="cookie-consent-title" className="font-heading font-semibold text-foreground text-sm">
        Cookies и аналитика
      </p>
      <p
        id="cookie-consent-desc"
        className="mt-2 text-muted-foreground text-xs leading-relaxed"
      >
        Мы используем технические данные в браузере (например, выбранную площадку) и, с вашего
        согласия, Яндекс.Метрику для статистики. Подробнее — в{" "}
        <Link
          href={LEGAL_COOKIES_ANALYTICS_PATH}
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          политике cookies
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          className="sm:flex-1"
          data-testid="cookie-consent-accept-all"
          onClick={() => {
            writeCookieConsent("all");
            setVisible(false);
          }}
        >
          Принять аналитику
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/15 bg-transparent sm:flex-1"
          data-testid="cookie-consent-essential-only"
          onClick={() => {
            writeCookieConsent("essential");
            setVisible(false);
          }}
        >
          Только необходимое
        </Button>
      </div>
    </div>
  );
}
