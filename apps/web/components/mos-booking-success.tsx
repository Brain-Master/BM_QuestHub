"use client";

import * as React from "react";
import { ExternalLink, Phone } from "lucide-react";

import { BRAINMASTER_SUPPORT_PHONE, BRAINMASTER_SUPPORT_PHONE_HREF } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

const MOS_AUTO_OPEN_DELAY_SECONDS = 3;

type Props = {
  mosUrl: string;
  onOpenMos?: () => void;
};

export function MosBookingSuccess({ mosUrl, onOpenMos }: Props) {
  const [secondsLeft, setSecondsLeft] = React.useState(MOS_AUTO_OPEN_DELAY_SECONDS);
  const [autoOpenEnabled] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [hasOpened, setHasOpened] = React.useState(false);
  const openedRef = React.useRef(false);

  const openMos = React.useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    setHasOpened(true);
    onOpenMos?.();
    window.open(mosUrl, "_blank", "noopener,noreferrer");
  }, [mosUrl, onOpenMos]);

  React.useEffect(() => {
    if (!autoOpenEnabled || openedRef.current) return;
    if (secondsLeft <= 0) {
      openMos();
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [autoOpenEnabled, openMos, secondsLeft]);

  return (
    <div className="grid gap-5 px-5 py-5 text-center" data-testid="mos-success">
      <div className="mx-auto grid size-12 place-items-center rounded-full border border-cyan-300/30 bg-cyan-400/15 text-cyan-200">
        ✓
      </div>
      <div className="grid gap-2">
        <h3 className="font-heading text-xl font-semibold text-white">
          Контакты получены
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          Дальше нужно оформить запись и договор на портале mos.ru. Если
          оформление окажется сложным, мы поможем пройти его до конца.
        </p>
      </div>

      <a
        href={BRAINMASTER_SUPPORT_PHONE_HREF}
        className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-sm text-white hover:bg-white/10"
      >
        <Phone className="size-4 text-cyan-300" aria-hidden />
        {BRAINMASTER_SUPPORT_PHONE}
      </a>

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

      {autoOpenEnabled && !hasOpened ? (
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
