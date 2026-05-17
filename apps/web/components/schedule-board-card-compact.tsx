"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";

import { ScheduleCapacityIndicator } from "@/components/schedule-capacity-indicator";
import { ScheduleInfoStrip } from "@/components/schedule-info-strip";
import { ScheduleMedia } from "@/components/schedule-media";
import { ScheduleStatusBadge } from "@/components/schedule-status-badge";
import { ScheduleTariffList } from "@/components/schedule-tariff-list";
import { Badge } from "@/components/ui/badge";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  item: ScheduleBoardItem;
  schoolSlug?: string;
  expanded?: boolean;
  highlighted?: boolean;
  onExpandChange?: (expanded: boolean, anchor: HTMLElement | null) => void;
  onNavigate?: () => void;
};

export function ScheduleBoardCardCompact({
  item,
  schoolSlug,
  expanded = false,
  highlighted = false,
  onExpandChange,
  onNavigate,
}: Props) {
  const variantsCount = item.variants.length || 1;
  const showDescriptionPreview = variantsCount === 1;
  const isLongDescription = item.description.length > 260;

  return (
    <article
      id={`schedule-offer-${item.offer.id}`}
      data-testid="schedule-card"
      className={cn(
        "group/schedule-card isolate overflow-hidden rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-card-bg)] shadow-[var(--schedule-card-shadow)] backdrop-blur-md transition lg:flex lg:h-[23rem]",
        item.status.isArchivedState
          ? "opacity-70 grayscale"
          : "hover:border-[color:var(--schedule-card-border-hover)]",
        highlighted && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="relative shrink-0 self-stretch lg:-mr-14">
        <Link
          href={item.questHref}
          aria-label={`Открыть ${item.displayTitle}`}
          className="block h-full"
          onClick={onNavigate}
        >
          <ScheduleMedia
            image={item.media.compact}
            title={item.displayTitle}
            mode="compact"
            className="lg:h-full"
          />
        </Link>
        <div
          className="pointer-events-none absolute inset-y-0 -right-36 z-10 hidden w-48 bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklch,var(--schedule-card-bg)_28%,transparent)_28%,color-mix(in_oklch,var(--schedule-card-bg)_72%,transparent)_58%,var(--schedule-card-bg)_100%)] lg:block"
          aria-hidden
        />
        <div className="absolute top-4 left-4 z-20 rounded-xl border border-white/25 bg-white/14 p-1 shadow-[0_10px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-xl">
          <ScheduleStatusBadge
            label={item.status.label}
            variant={item.status.variant}
          />
        </div>
      </div>

      <div className="relative z-20 flex min-w-0 flex-1 flex-col gap-2.5 overflow-hidden p-4">
        <div className="flex flex-nowrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="h-7 border-white/15 bg-slate-950/70 text-sky-100"
              >
                {tag}
              </Badge>
            ))}
            {item.commonAgeLabel ? (
              <Badge
                variant="outline"
                className="h-7 border-white/15 bg-slate-950/70 text-emerald-100"
              >
                {item.commonAgeLabel}
              </Badge>
            ) : null}
          </div>
          <div className="ml-auto flex w-36 shrink-0 justify-end">
            <ScheduleCapacityIndicator
              capacity={item.capacity}
              archived={item.status.isArchivedState}
              compact
            />
          </div>
        </div>

        <div className="min-w-0">
          <Link
            href={item.questHref}
            className="group/title inline-flex items-start gap-2 text-foreground transition hover:text-primary"
            onClick={onNavigate}
          >
            <h3 className="font-heading text-xl font-semibold leading-tight">
              {item.displayTitle}
            </h3>
            <ArrowUpRight
              className="mt-0.5 size-4 shrink-0 opacity-0 transition group-hover/title:opacity-100"
              aria-hidden
            />
          </Link>
        </div>

        <ScheduleInfoStrip item={item} compact />

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              "flex h-full flex-col transition-opacity duration-300",
              expanded ? "invisible opacity-0 pointer-events-none" : "visible opacity-100",
            )}
          >
            {showDescriptionPreview || !isLongDescription ? (
              <div className="mb-2 min-h-0 flex-1 overflow-hidden">
                <p className="line-clamp-[var(--schedule-description-lines)] text-muted-foreground text-sm leading-relaxed [--schedule-description-lines:3] min-[1180px]:[--schedule-description-lines:4]">
                  {item.description}
                </p>
              </div>
            ) : (
              <div className="sr-only" aria-hidden />
            )}

            <div className="mt-auto">
              {isLongDescription ? (
                <button
                  type="button"
                  className="mb-2 inline-flex w-fit items-center gap-1 text-primary text-sm transition hover:text-primary/80"
                onClick={(event) => onExpandChange?.(true, event.currentTarget)}
                >
                  Подробнее о смене
                  <ChevronDown className="size-4 transition-transform" aria-hidden />
                </button>
              ) : null}

              <div data-testid="variants-container">
                <ScheduleTariffList item={item} schoolSlug={schoolSlug} compact />
              </div>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex flex-col transition-all duration-300",
              expanded
                ? "z-10 translate-y-0 opacity-100"
                : "-z-10 translate-y-2 opacity-0 pointer-events-none",
            )}
          >
            <div className="bm-scrollbar min-h-0 flex-1 overflow-y-auto pr-3 text-muted-foreground text-sm leading-relaxed [scrollbar-width:thin]">
              <p className="pb-2">{item.description}</p>
            </div>
            <button
              type="button"
              className="mt-2 inline-flex w-fit items-center gap-1 bg-[color:var(--schedule-card-bg)] pt-1 text-primary text-sm transition hover:text-primary/80"
              onClick={(event) => onExpandChange?.(false, event.currentTarget)}
            >
              Скрыть описание и выбрать формат
              <ChevronDown className="size-4 rotate-180 transition-transform" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
