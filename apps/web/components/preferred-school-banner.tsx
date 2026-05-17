"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  parsePreferredSchool,
  PREFERRED_SCHOOL_STORAGE_KEY,
  type PreferredSchool,
} from "@/lib/preferred-school";
import { cn } from "@/lib/utils";

type Props = {
  mode: "agenda" | "catalog";
};

export function PreferredSchoolBanner({ mode }: Props) {
  const [preferred, setPreferred] = React.useState<PreferredSchool | null>(() => {
    if (typeof window === "undefined") return null;
    return parsePreferredSchool(localStorage.getItem(PREFERRED_SCHOOL_STORAGE_KEY));
  });

  if (!preferred) return null;

  const href =
    mode === "agenda"
      ? `/sites/${preferred.slug}/agenda`
      : `/sites/${preferred.slug}/catalog`;

  return (
    <aside className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 text-sm">
      <p className="text-foreground">
        Показаны все площадки.{" "}
        <Link href={href} className="font-medium text-primary hover:text-primary/80">
          Вернуться к {mode === "agenda" ? "расписанию" : "каталогу"}:{" "}
          {preferred.name}
        </Link>
      </p>
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
        )}
        onClick={() => {
          localStorage.removeItem(PREFERRED_SCHOOL_STORAGE_KEY);
          setPreferred(null);
        }}
      >
        <X className="size-4" aria-hidden />
        Забыть
      </button>
    </aside>
  );
}
