import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Train, User } from "lucide-react";

import { ScheduleCapacityIndicator } from "@/components/schedule-capacity-indicator";
import { ScheduleMedia } from "@/components/schedule-media";
import { ScheduleStatusBadge } from "@/components/schedule-status-badge";
import { ScheduleTariffList } from "@/components/schedule-tariff-list";
import { Badge } from "@/components/ui/badge";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  item: ScheduleBoardItem;
  schoolSlug?: string;
};

export function ScheduleBoardCardDetailed({ item, schoolSlug }: Props) {
  return (
    <article
      data-testid="schedule-card"
      className={cn(
        "group/schedule-card overflow-hidden rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-card-bg)] shadow-[var(--schedule-card-shadow)] backdrop-blur-md transition",
        item.status.isArchivedState
          ? "opacity-70 grayscale"
          : "hover:border-[color:var(--schedule-card-border-hover)]",
      )}
    >
      <div className="grid">
        <div className="relative">
          <Link href={item.questHref} aria-label={`Открыть ${item.displayTitle}`}>
            <ScheduleMedia image={item.media.hero} title={item.displayTitle} mode="detailed" />
          </Link>
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
                  <Badge key={tag} variant="outline" className="border-white/10 bg-black/25">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Link
                href={item.questHref}
                className="group/title inline-flex items-start gap-2 text-foreground transition hover:text-primary"
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
            <ScheduleCapacityIndicator
              capacity={item.capacity}
              archived={item.status.isArchivedState}
              className="mt-1"
            />
          </div>

          <p className="max-w-4xl text-muted-foreground text-sm leading-relaxed sm:text-base">
            {item.description}
          </p>

          <div className="grid gap-3 rounded-xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-info-bg)] p-4 text-sm md:grid-cols-12 md:items-center md:p-5">
            <div className="min-w-0 md:col-span-5">
              <div className="mb-1.5 flex items-center gap-2 font-medium text-primary">
                <Train className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{item.venue.name}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground text-xs">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="line-clamp-2">
                  {item.venue.metro ? `м. ${item.venue.metro} · ` : null}
                  {item.venue.address}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-white/10 border-t pt-3 md:col-span-3 md:border-t-0 md:border-l md:pl-5 md:pt-0">
              <CalendarDays className="size-5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block text-muted-foreground text-xs">Даты</span>
                {item.dateLabel}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-3 border-white/10 border-t pt-3 md:col-span-4 md:border-t-0 md:border-l md:pl-5 md:pt-0">
              <User className="size-5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="block text-muted-foreground text-xs">Наставник</span>
                <span className="block truncate">
                  {item.teacherName ?? "Наставник назначается"}
                </span>
              </span>
            </div>
          </div>

          <ScheduleTariffList item={item} schoolSlug={schoolSlug} />
        </div>
      </div>
    </article>
  );
}
