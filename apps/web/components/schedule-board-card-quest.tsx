"use client";

import { Layers3 } from "lucide-react";

import { ScheduleCapacityIndicator } from "@/components/schedule-capacity-indicator";
import { ScheduleInfoStrip } from "@/components/schedule-info-strip";
import { ScheduleStatusBadge } from "@/components/schedule-status-badge";
import { ScheduleTariffList } from "@/components/schedule-tariff-list";
import { Badge } from "@/components/ui/badge";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  item: ScheduleBoardItem;
  schoolSlug?: string;
  highlighted?: boolean;
};

function formatVariantCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} формат`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} формата`;
  }
  return `${count} форматов`;
}

export function ScheduleBoardCardQuest({
  item,
  schoolSlug,
  highlighted = false,
}: Props) {
  const variantsCount = item.variants.length || 1;

  return (
    <article
      id={`schedule-offer-${item.offer.id}`}
      data-testid="schedule-card"
      className={cn(
        "overflow-hidden rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-card-bg)] p-4 shadow-[var(--schedule-card-shadow)] backdrop-blur-md transition sm:p-5",
        item.status.isArchivedState
          ? "opacity-70 grayscale"
          : "hover:border-[color:var(--schedule-card-border-hover)]",
        highlighted && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ScheduleStatusBadge
                label={item.status.label}
                variant={item.status.variant}
              />
              <Badge
                variant="outline"
                className="h-7 border-white/10 bg-black/20 text-muted-foreground"
              >
                <Layers3 className="size-3.5 text-primary" aria-hidden />
                {formatVariantCount(variantsCount)}
              </Badge>
              {item.commonAgeLabel ? (
                <Badge
                  variant="outline"
                  className="h-7 border-white/10 bg-black/20 text-emerald-100"
                >
                  {item.commonAgeLabel}
                </Badge>
              ) : null}
            </div>
          </div>

          <ScheduleCapacityIndicator
            capacity={item.capacity}
            archived={item.status.isArchivedState}
            className="self-start"
          />
        </div>

        <ScheduleInfoStrip
          item={item}
          compact
          className="rounded-xl border border-white/10 bg-black/15 px-3 py-3"
        />

        <div className="grid gap-3">
          <h4 className="px-1 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
            Форматы участия
          </h4>
          <ScheduleTariffList item={item} schoolSlug={schoolSlug} compact />
        </div>
      </div>
    </article>
  );
}
