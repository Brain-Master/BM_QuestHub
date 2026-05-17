"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  summary: string;
  panelId: string;
  activeCount?: number;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  "data-testid"?: string;
};

export function FilterDisclosure({
  title,
  summary,
  panelId,
  activeCount = 0,
  children,
  className,
  contentClassName,
  "data-testid": testId,
}: Props) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const syncOpenState = () => setOpen(media.matches);
    syncOpenState();
    media.addEventListener("change", syncOpenState);
    return () => media.removeEventListener("change", syncOpenState);
  }, []);

  return (
    <div
      data-testid={testId}
      className={cn(
        "rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-toolbar-bg)] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="group/filter flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-heading font-semibold text-lg">{title}</span>
            <span className="text-muted-foreground text-sm">
              {activeCount > 0 ? `Активно: ${activeCount}` : summary}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/filter:text-foreground",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <div className="hidden rounded-full border border-white/10 bg-black/20 px-3 py-1 text-muted-foreground text-xs lg:block">
          {open ? "Свернуть" : "Показать фильтры"}
        </div>
      </div>

      <div
        id={panelId}
        className={cn(
          "w-full",
          contentClassName,
          open ? "mt-4 opacity-100" : "hidden opacity-0 pointer-events-none",
        )}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
