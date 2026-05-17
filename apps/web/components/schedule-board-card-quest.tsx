"use client";

import * as React from "react";
import { CalendarDays, ChevronDown, Layers3, MapPin, Train, User } from "lucide-react";

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

function teacherDisplayName(name: string | null): string {
  if (!name) return "Наставник назначается";

  const firstTeacher = name.split(";")[0]?.trim() ?? name.trim();
  const parts = firstTeacher.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return firstTeacher;

  const [surname, firstName, patronymic] = parts;
  const initials = [firstName, patronymic]
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase()}.`)
    .join("");

  return initials ? `${surname} ${initials}` : surname;
}

function yandexMapsHref(item: ScheduleBoardItem): string {
  const query = [item.venue.name, item.venue.metro && `м. ${item.venue.metro}`, item.venue.address]
    .filter(Boolean)
    .join(", ");

  return `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
}

export function ScheduleBoardCardQuest({
  item,
  schoolSlug,
  highlighted = false,
}: Props) {
  const variantsCount = item.variants.length || 1;
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const detailsId = `schedule-offer-${item.offer.id}-mobile-details`;

  return (
    <article
      id={`schedule-offer-${item.offer.id}`}
      data-testid="schedule-card"
      className={cn(
        "overflow-hidden rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-card-bg)] p-3 shadow-[var(--schedule-card-shadow)] backdrop-blur-md transition sm:p-5",
        item.status.isArchivedState
          ? "opacity-70 grayscale"
          : "hover:border-[color:var(--schedule-card-border-hover)]",
        highlighted && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex flex-col gap-2.5 sm:gap-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <ScheduleStatusBadge
                label={item.status.label}
                variant={item.status.variant}
                className="h-6 px-2 text-[10px] sm:h-7 sm:text-xs"
              />
              <Badge
                variant="outline"
                className="h-6 border-white/10 bg-black/20 px-2 text-[10px] text-muted-foreground sm:h-7 sm:text-xs"
              >
                <Layers3 className="size-3 text-primary sm:size-3.5" aria-hidden />
                {formatVariantCount(variantsCount)}
              </Badge>
              {item.commonAgeLabel ? (
                <Badge
                  variant="outline"
                  className="h-6 border-white/10 bg-black/20 px-2 text-[10px] text-emerald-100 sm:h-7 sm:text-xs"
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
          mobileDense
          className="rounded-xl border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3 sm:py-3"
        />

        <div className="grid gap-1.5 sm:hidden">
          <button
            type="button"
            data-testid="schedule-quest-details-toggle"
            className="inline-flex h-8 w-full items-center justify-between rounded-xl border border-white/10 bg-black/15 px-2.5 font-medium text-primary text-xs transition hover:bg-white/5"
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {detailsOpen ? "Скрыть детали площадки" : "Подробнее о площадке"}
            <ChevronDown
              className={cn("size-3.5 transition-transform", detailsOpen && "rotate-180")}
              aria-hidden
            />
          </button>

          {detailsOpen ? (
            <div
              id={detailsId}
              data-testid="schedule-quest-details"
              className="rounded-xl border border-white/10 bg-black/15 text-muted-foreground text-xs"
            >
              <div className="grid gap-2 px-2.5 py-2">
                <div className="inline-flex items-center gap-1.5 text-foreground">
                  <CalendarDays className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {item.shortDateLabel}
                </div>

                {item.venue.metro ? (
                  <div className="inline-flex items-center gap-1.5 text-primary/80">
                    <Train className="size-3.5 shrink-0 text-primary" aria-hidden />
                    м. {item.venue.metro}
                  </div>
                ) : null}

                <a
                  href={yandexMapsHref(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/location inline-flex items-start gap-1.5 transition hover:text-foreground"
                  aria-label={`Открыть адрес в Яндекс Картах: ${item.venue.address}`}
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block">{item.venue.address}</span>
                    {item.locationNote ? (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground/65">
                        {item.locationNote}
                      </span>
                    ) : null}
                  </span>
                </a>

                <div className="inline-flex items-center gap-1.5">
                  <User className="size-3.5 shrink-0 text-primary" aria-hidden />
                  <span title={item.teacherName ?? undefined}>
                    Наставник: {teacherDisplayName(item.teacherName)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-1.5 sm:gap-3">
          <h4 className="hidden px-1 font-semibold text-muted-foreground text-sm uppercase tracking-wider sm:block">
            Форматы участия
          </h4>
          <ScheduleTariffList item={item} schoolSlug={schoolSlug} compact mobileDense />
        </div>
      </div>
    </article>
  );
}
