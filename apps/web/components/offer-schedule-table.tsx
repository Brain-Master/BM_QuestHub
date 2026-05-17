"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { OfferBookingAction } from "@/components/offer-booking-action";
import type { Quest, Venue, VenueOffer } from "@/lib/schemas";
import { venueVisibleForSchoolScope } from "@/lib/school-scope";

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

  const visibleRows = React.useMemo(() => {
    if (!schoolSlug) return rows;
    return rows.filter((r) =>
      venueVisibleForSchoolScope(r.venue, schoolSlug),
    );
  }, [rows, schoolSlug]);

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
            visibleRows.map((row) => (
                <tr
                  key={row.offer.id}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
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
                  <td className="px-4 py-4 align-top whitespace-pre-line">
                    {row.offer.daySchedule}
                  </td>
                  <td className="px-4 py-4 align-top">{row.offer.priceLabel}</td>
                  <td className="px-4 py-4 align-top">
                    <OfferBookingAction
                      quest={quest}
                      offer={row.offer}
                      venue={row.venue}
                      schoolSlug={schoolSlug}
                      showIncludedNote
                    />
                  </td>
                </tr>
            ))
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
