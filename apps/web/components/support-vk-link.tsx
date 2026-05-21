import { Users } from "lucide-react";

import {
  BRAINMASTER_COMMUNITY_VK_LABEL,
  BRAINMASTER_COMMUNITY_VK_URL,
} from "@/lib/site-contact";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Primary CTA styling on community-focused panels */
  prominent?: boolean;
  /** Inline text link (footer) */
  plain?: boolean;
};

export function SupportVkLink({ className, prominent = false, plain = false }: Props) {
  return (
    <a
      href={BRAINMASTER_COMMUNITY_VK_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="support-vk-link"
      className={cn(
        plain
          ? "text-muted-foreground hover:text-foreground"
          : prominent
            ? "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#0077FF]/40 bg-[#0077FF]/15 py-3 font-semibold text-sm text-white transition-colors hover:bg-[#0077FF]/25"
            : "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-sm text-white hover:bg-white/10",
        className,
      )}
    >
      {!plain ? <Users className="size-4 text-sky-300" aria-hidden /> : null}
      {BRAINMASTER_COMMUNITY_VK_LABEL}
    </a>
  );
}
