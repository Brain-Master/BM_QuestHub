"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { OfferBookingAction } from "@/components/offer-booking-action";
import type { ScheduleBoardVariant } from "@/lib/offers/schedule-board";
import type { Quest, Venue, VenueOffer } from "@/lib/schemas";
import { venueVisibleForSchoolScope } from "@/lib/school-scope";
import { cn } from "@/lib/utils";

export type ScheduleRowModel = {
  offer: VenueOffer;
  venue: Venue;
};

type Props = {
  quest: Pick<Quest, "slug" | "title">;
  rows: ScheduleRowModel[];
};

export function OfferScheduleTable({ quest, rows }: Props) {
  const searchParams = useSearchParams();
  const schoolSlug = searchParams.get("school")?.trim() || undefined;
  const offerId = searchParams.get("offer")?.trim() || undefined;

  const visibleRows = React.useMemo(() => {
    if (!schoolSlug) return rows;
    return rows.filter((r) =>
      venueVisibleForSchoolScope(r.venue, schoolSlug),
    );
  }, [rows, schoolSlug]);

  React.useEffect(() => {
    if (!offerId) return;
    const el = document.getElementById(`quest-offer-${offerId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [offerId, visibleRows]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-inner">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-white/[0.04] text-left text-muted-foreground">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 font-medium text-foreground">Площадка</th>
              <th className="px-4 py-3 font-medium text-foreground">Смена</th>
              <th className="px-4 py-3 font-medium text-foreground">Даты</th>
              <th className="px-4 py-3 font-medium text-foreground">День</th>
              <th className="px-4 py-3 font-medium text-foreground">Цена</th>
              <th className="px-4 py-3 font-medium text-foreground">Запись</th>
            </tr>
          </thead>
          <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                Для выбранного школьного скоупа пока нет релевантных смен —
                откройте полный каталог без фильтра школы.
              </td>
            </tr>
          ) : (
            visibleRows.map((row) => {
              const variants = buildQuestTableVariants(row.offer);
              return (
                <tr
                  id={`quest-offer-${row.offer.id}`}
                  key={row.offer.id}
                  className={cn(
                    "border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]",
                    offerId === row.offer.id && "bg-primary/10 ring-1 ring-primary/40",
                  )}
                >
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium">{row.venue.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {row.venue.metro ? `${row.venue.metro} · ` : null}
                      {row.venue.address}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">{row.offer.shiftLabel}</td>
                  <td className="px-4 py-4 align-top">{row.offer.dateRange}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="grid gap-2">
                      {variants.map((variant) => (
                        <div key={variant.id} className="text-xs">
                          <div className="font-medium text-foreground">
                            {variant.type}
                          </div>
                          <div className="text-muted-foreground">{variant.time}</div>
                          {variant.note ? (
                            <div className="text-muted-foreground/80">
                              {variant.note}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="grid gap-2">
                      {variants.map((variant) => (
                        <div key={variant.id}>{variant.priceLabel}</div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="grid gap-2">
                      {variants.map((variant) => (
                        <OfferBookingAction
                          key={variant.id}
                          quest={quest}
                          offer={row.offer}
                          venue={row.venue}
                          schoolSlug={schoolSlug}
                          showIncludedNote
                          mode={variant.bookingMode}
                          variant={variant}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildQuestTableVariants(offer: VenueOffer): ScheduleBoardVariant[] {
  const source =
    offer.scheduleCard?.variants && offer.scheduleCard.variants.length > 0
      ? offer.scheduleCard.variants
      : [
          {
            id: offer.id,
            type: offer.scheduleCard?.formatType ?? offer.shiftLabel,
            time: offer.scheduleCard?.formatTime ?? offer.daySchedule,
            priceLabel: offer.priceLabel,
            note: offer.scheduleCard?.formatNote ?? offer.includedNote ?? null,
            ageLabel: offer.scheduleCard?.ageLabel,
            mosRuCode: offer.scheduleCard?.mosRuCode,
            mosBookingUrl: offer.mosBookingUrl,
          },
        ];

  return source.map((variant) => ({
    id: variant.id,
    type: variant.type,
    time: variant.time,
    priceLabel: variant.priceLabel,
    note: variant.note?.trim() ? variant.note : null,
    ageLabel: variant.ageLabel?.trim() ? variant.ageLabel : null,
    mosRuCode: variant.mosRuCode?.trim() ? variant.mosRuCode : null,
    bookingMode: variant.mosBookingUrl
      ? { kind: "mos", label: "На mos.ru", url: variant.mosBookingUrl }
      : { kind: "form", label: "Записаться" },
  }));
}
