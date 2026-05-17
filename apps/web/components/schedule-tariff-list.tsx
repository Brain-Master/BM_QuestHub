import { Clock, Info } from "lucide-react";

import { OfferBookingAction } from "@/components/offer-booking-action";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  item: ScheduleBoardItem;
  schoolSlug?: string;
  compact?: boolean;
  className?: string;
};

export function ScheduleTariffList({
  item,
  schoolSlug,
  compact = false,
  className,
}: Props) {
  return (
    <div data-testid="schedule-tariffs" className={cn("grid gap-3", className)}>
      <div
        className={cn(
          "grid gap-3 rounded-xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-tariff-bg)] p-4",
          compact ? "lg:grid-cols-[1fr_auto]" : "lg:grid-cols-[1fr_12rem_auto]",
          "lg:items-center",
        )}
      >
        <div className="min-w-0">
          <p className="font-medium leading-snug text-foreground">
            {item.formatType}
          </p>
          {item.formatNote ? (
            <p className="mt-2 flex gap-1.5 text-muted-foreground text-xs leading-relaxed">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span className={compact ? "line-clamp-2" : "line-clamp-3"}>
                {item.formatNote}
              </span>
            </p>
          ) : null}
        </div>

        {!compact ? (
          <div className="hidden items-center justify-center border-white/10 border-l pl-4 text-muted-foreground text-xs lg:flex">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5">
              <Clock className="size-3.5 text-primary" aria-hidden />
              {item.timeLabel}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-white/10 border-t pt-3 lg:justify-end lg:border-t-0 lg:pt-0">
          {compact ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-muted-foreground text-xs">
              <Clock className="size-3.5 text-primary" aria-hidden />
              {item.timeLabel}
            </span>
          ) : null}
          <div className="font-heading font-semibold text-lg text-foreground">
            {item.offer.priceLabel}
          </div>
          <OfferBookingAction
            quest={item.quest}
            offer={item.offer}
            venue={item.venue}
            schoolSlug={schoolSlug}
            mode={item.bookingMode}
          />
        </div>
      </div>
    </div>
  );
}
