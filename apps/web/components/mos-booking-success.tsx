"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import { CommunityVkFollowHint } from "@/components/community-vk-follow-hint";
import { SupportContactStack } from "@/components/support-contact-stack";
import { cn } from "@/lib/utils";

const MOS_AUTO_OPEN_DELAY_SECONDS = 3;

type Props = {
  mosUrl: string;
  contactsSaved?: boolean;
  title?: string;
  text?: string;
  onOpenMos?: () => void;
};

export function MosBookingSuccess({
  mosUrl,
  contactsSaved = true,
  title,
  text,
  onOpenMos,
}: Props) {
  const [secondsLeft, setSecondsLeft] = React.useState(MOS_AUTO_OPEN_DELAY_SECONDS);
  const [autoOpenEnabled] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [hasOpened, setHasOpened] = React.useState(false);
  const openedRef = React.useRef(false);

  const resolvedTitle = title ?? (contactsSaved ? "Контакты получены" : "Продолжите запись на mos.ru");
  const resolvedText =
    text ??
    (contactsSaved
      ? "Дальше нужно оформить запись и договор на портале mos.ru. Если оформление окажется сложным, мы поможем пройти его до конца."
      : "Оформите запись на портале mos.ru — кнопка ниже. Если понадобится помощь, свяжитесь с нами.");

  const openMos = React.useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    setHasOpened(true);
    onOpenMos?.();
    window.open(mosUrl, "_blank", "noopener,noreferrer");
  }, [mosUrl, onOpenMos]);

  const shouldAutoOpen = contactsSaved && autoOpenEnabled;

  React.useEffect(() => {
    if (!shouldAutoOpen || openedRef.current) return;
    if (secondsLeft <= 0) {
      openMos();
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [shouldAutoOpen, openMos, secondsLeft]);

  return (
    <div
      className="grid gap-5 px-5 py-5 text-center"
      data-testid={contactsSaved ? "mos-success" : "mos-success-fallback"}
    >
      <div className="mx-auto grid size-12 place-items-center rounded-full border border-cyan-300/30 bg-cyan-400/15 text-cyan-200">
        {contactsSaved ? "✓" : "→"}
      </div>
      <div className="grid gap-2">
        <h3 className="font-heading text-xl font-semibold text-white">{resolvedTitle}</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{resolvedText}</p>
      </div>

      <SupportContactStack />
      <CommunityVkFollowHint />

      <button
        type="button"
        onClick={openMos}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(8,145,178,0.3)] transition-all",
          "hover:from-cyan-500 hover:to-blue-500 hover:shadow-[0_0_25px_rgba(8,145,178,0.5)]",
        )}
      >
        Подать заявку на mos.ru
        <ExternalLink className="size-4" aria-hidden />
      </button>

      {shouldAutoOpen && !hasOpened ? (
        <p className="text-slate-500 text-xs">
          Автоматически откроем mos.ru через {Math.max(secondsLeft, 0)} сек.
        </p>
      ) : (
        <p className="text-slate-500 text-xs">
          Нажмите кнопку, чтобы открыть mos.ru в новой вкладке.
        </p>
      )}
    </div>
  );
}
