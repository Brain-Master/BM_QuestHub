import { Send } from "lucide-react";

import {
  BRAINMASTER_SUPPORT_TELEGRAM_LABEL,
  BRAINMASTER_SUPPORT_TELEGRAM_URL,
} from "@/lib/site-contact";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  plain?: boolean;
};

export function SupportTelegramLink({ className, plain = false }: Props) {
  return (
    <a
      href={BRAINMASTER_SUPPORT_TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="support-telegram-link"
      className={cn(
        plain
          ? "text-muted-foreground hover:text-foreground"
          : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 py-3 font-semibold text-sm text-white transition-colors hover:bg-slate-800",
        className,
      )}
    >
      {!plain ? <Send className="size-4 text-cyan-300" aria-hidden /> : null}
      {BRAINMASTER_SUPPORT_TELEGRAM_LABEL}
    </a>
  );
}
