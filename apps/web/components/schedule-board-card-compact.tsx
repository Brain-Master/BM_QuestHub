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

export function ScheduleBoardCardCompact({ item, schoolSlug }: Props) {
  return (
    <article
      data-testid="schedule-card"
      className={cn(
        "group/schedule-card overflow-hidden rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-card-bg)] shadow-[var(--schedule-card-shadow)] backdrop-blur-md transition sm:flex",
        item.status.isArchivedState
          ? "opacity-70 grayscale"
          : "hover:border-[color:var(--schedule-card-border-hover)]",
      )}
    >
      <Link
        href={item.questHref}
        aria-label={`Открыть ${item.displayTitle}`}
        className="block shrink-0"
      >
        <ScheduleMedia image={item.media.compact} title={item.displayTitle} mode="compact" />
      </Link>

      <div className="grid min-w-0 flex-1 gap-4 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <ScheduleStatusBadge
              label={item.status.label}
              variant={item.status.variant}
            />
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="h-7 border-white/10 bg-black/20">
                {tag}
              </Badge>
            ))}
          </div>
          <ScheduleCapacityIndicator
            capacity={item.capacity}
            archived={item.status.isArchivedState}
            compact
          />
        </div>

        <div className="min-w-0">
          <Link
            href={item.questHref}
            className="group/title inline-flex items-start gap-2 text-foreground transition hover:text-primary"
          >
            <h3 className="font-heading text-xl font-semibold leading-tight">
              {item.displayTitle}
            </h3>
            <ArrowUpRight
              className="mt-0.5 size-4 shrink-0 opacity-0 transition group-hover/title:opacity-100"
              aria-hidden
            />
          </Link>
          <p className="mt-2 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="grid gap-2 text-muted-foreground text-xs sm:grid-cols-2 lg:grid-cols-4">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-primary" aria-hidden />
            {item.dateLabel}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <Train className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="truncate">{item.venue.name}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="truncate">
              {item.venue.metro ? `м. ${item.venue.metro}` : item.venue.address}
            </span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <User className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="truncate">
              {item.teacherName ?? "Наставник назначается"}
            </span>
          </span>
        </div>

        <ScheduleTariffList item={item} schoolSlug={schoolSlug} compact />
      </div>
    </article>
  );
}
