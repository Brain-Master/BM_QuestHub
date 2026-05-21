import { Phone } from "lucide-react";

import {
  BRAINMASTER_SUPPORT_PHONE,
  BRAINMASTER_SUPPORT_PHONE_HREF,
} from "@/lib/site-contact";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  plain?: boolean;
};

export function SupportPhoneLink({ className, plain = false }: Props) {
  return (
    <a
      href={BRAINMASTER_SUPPORT_PHONE_HREF}
      data-testid="support-phone-link"
      className={cn(
        plain
          ? "text-muted-foreground hover:text-foreground"
          : "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-sm text-white hover:bg-white/10",
        className,
      )}
    >
      {!plain ? <Phone className="size-4 text-cyan-300" aria-hidden /> : null}
      {plain ? `Позвонить: ${BRAINMASTER_SUPPORT_PHONE}` : BRAINMASTER_SUPPORT_PHONE}
    </a>
  );
}
