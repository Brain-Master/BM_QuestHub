"use client";

import { Phone } from "lucide-react";

import {
  BRAINMASTER_SUPPORT_PHONE,
  BRAINMASTER_SUPPORT_PHONE_HREF,
} from "@/lib/site-contact";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  text: string;
  onClose: () => void;
};

export function LeadFormSuccess({ title, text, onClose }: Props) {
  return (
    <div className="grid gap-5 px-5 py-5 text-center" data-testid="lead-form-success">
      <div className="mx-auto grid size-12 place-items-center rounded-full border border-cyan-300/30 bg-cyan-400/15 text-cyan-200">
        ✓
      </div>
      <div className="grid gap-2">
        <h3 className="font-heading text-xl font-semibold text-white">{title}</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
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
        onClick={onClose}
        className={cn(
          "w-full rounded-lg border border-slate-700 bg-slate-800/80 py-3 font-semibold text-sm text-white transition-colors hover:bg-slate-800",
        )}
      >
        Закрыть
      </button>
    </div>
  );
}
