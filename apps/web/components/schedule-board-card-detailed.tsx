"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowUpRight } from "lucide-react";

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
  highlighted?: boolean;
  onNavigate?: () => void;
};

export function ScheduleBoardCardDetailed({
  item,
  schoolSlug,
  highlighted = false,
  onNavigate,
}: Props) {
  const [expandedDescription, setExpandedDescription] = React.useState(false);
  const isLongDescription = item.description.length > 220;

  return (
    <article
      id={`schedule-offer-${item.offer.id}`}
      data-testid="schedule-card"
      className={cn(
        "group/schedule-card overflow-hidden rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-card-bg)] shadow-[var(--schedule-card-shadow)] backdrop-blur-md transition",
        item.status.isArchivedState
          ? "opacity-70 grayscale"
          : "hover:border-[color:var(--schedule-card-border-hover)]",
        highlighted && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="grid">
        <div className="relative">
          <Link
            href={item.questHref}
            aria-label={`Открыть ${item.displayTitle}`}
            className="block"
            onClick={onNavigate}
          >
            <ScheduleMedia image={item.media.hero} title={item.displayTitle} mode="detailed" />
          </Link>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent" />
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
            <ScheduleStatusBadge
              label={item.status.label}
              variant={item.status.variant}
            />
            {item.mosRuCode ? (
              <Badge
                variant="outline"
                className="h-7 border-white/10 bg-black/35 px-3 backdrop-blur-md"
              >
                Код: {item.mosRuCode}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="-mt-16 relative z-10 grid gap-6 p-5 sm:-mt-20 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-white/15 bg-slate-950/70 text-sky-100 shadow-[0_0_12px_rgba(56,189,248,0.18)] backdrop-blur"
                  >
                    {tag}
                  </Badge>
                ))}
                {item.commonAgeLabel ? (
                  <Badge
                    variant="outline"
                    className="border-white/15 bg-slate-950/70 text-emerald-100"
                  >
                    {item.commonAgeLabel}
                  </Badge>
                ) : null}
              </div>
              <Link
                href={item.questHref}
                aria-label={`Открыть ${item.displayTitle}`}
                className="group/title inline-flex items-start gap-2 text-foreground transition hover:text-primary"
                onClick={onNavigate}
              >
                <h3 className="font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  {item.displayTitle}
                </h3>
                <ArrowUpRight
                  className="mt-1 size-5 shrink-0 opacity-0 transition group-hover/title:opacity-100"
                  aria-hidden
                />
              </Link>
            </div>
          </div>

          <p
            className={cn(
              "max-w-4xl text-muted-foreground text-sm leading-relaxed sm:text-base",
              !expandedDescription && "line-clamp-2",
            )}
          >
            {item.description}
          </p>
          {isLongDescription ? (
            <button
              type="button"
              className="w-fit text-primary text-sm transition hover:text-primary/80"
              onClick={() => setExpandedDescription((value) => !value)}
            >
              {expandedDescription ? "Скрыть описание" : "Подробнее о смене"}
            </button>
          ) : null}

          <ScheduleInfoStrip item={item} />

          <div className="grid gap-3">
            <div className="grid grid-cols-[minmax(0,1fr)_9rem] items-end gap-4 px-1">
              <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                Форматы участия
              </h4>
              <div className="flex justify-end">
                <ScheduleCapacityIndicator
                  capacity={item.capacity}
                  archived={item.status.isArchivedState}
                  className="justify-end"
                />
              </div>
            </div>
            <ScheduleTariffList item={item} schoolSlug={schoolSlug} />
          </div>
        </div>
      </div>
    </article>
  );
}
