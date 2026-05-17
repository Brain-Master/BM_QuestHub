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
  const variants = item.variants.length
    ? item.variants
    : [
        {
          id: item.offer.id,
          type: item.formatType,
          time: item.timeLabel,
          priceLabel: item.offer.priceLabel,
          note: item.formatNote,
          ageLabel: item.commonAgeLabel,
          mosRuCode: item.mosRuCode,
          bookingMode: item.bookingMode,
        },
      ];

  return (
    <div
      data-testid="schedule-tariffs"
      className={cn("grid", compact ? "gap-1" : "gap-3", className)}
    >
      {variants.map((variant) => (
        <div
          key={variant.id}
          data-testid="schedule-tariff-row"
          className={cn(
            "grid rounded-xl border",
            compact
              ? "gap-1 border-white/7 bg-white/[0.035] p-2 lg:grid-cols-[1fr_auto]"
              : "gap-3 border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-tariff-bg)] p-4 lg:grid-cols-[1fr_12rem_auto]",
            "lg:items-center",
          )}
        >
          <div className="min-w-0">
            <p
              className={cn(
                "font-medium leading-snug text-foreground",
                compact && "text-sm",
              )}
            >
              {variant.type}
            </p>
            {!item.commonAgeLabel && variant.ageLabel ? (
              <p className="mt-1 text-primary text-xs">{variant.ageLabel}</p>
            ) : null}
            {variant.note && !compact ? (
              <p className="mt-2 flex gap-1.5 text-muted-foreground text-xs leading-relaxed">
                <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="line-clamp-3">{variant.note}</span>
              </p>
            ) : null}
          </div>

          {!compact ? (
            <div className="hidden items-center justify-center border-white/10 border-l pl-4 text-muted-foreground text-xs lg:flex">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5">
                <Clock className="size-3.5 text-primary" aria-hidden />
                {variant.time}
              </span>
            </div>
          ) : null}

          <div
            className={cn(
              "flex flex-wrap items-center justify-between border-white/10 border-t lg:justify-end lg:border-t-0 lg:pt-0",
              compact ? "gap-1.5 pt-1.5" : "gap-3 pt-3",
            )}
          >
            {compact ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-muted-foreground text-xs">
                <Clock className="size-3.5 text-primary" aria-hidden />
                {variant.time}
              </span>
            ) : null}
            <div
              className={cn(
                "font-heading font-semibold text-foreground",
                compact ? "text-base" : "text-lg",
              )}
            >
              {variant.priceLabel}
            </div>
            <OfferBookingAction
              quest={item.quest}
              offer={item.offer}
              venue={item.venue}
              schoolSlug={schoolSlug}
              mode={variant.bookingMode}
              variant={variant}
              compact={compact}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
