"use client";

import * as React from "react";

import { BookingForm } from "@/components/booking-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveBookingAction } from "@/lib/booking";
import {
  trackBookingExternal,
  trackBookingFormOpen,
} from "@/lib/client-analytics";
import type { Quest, Venue, VenueOffer } from "@/lib/schemas";
import { venueVisibleForSchoolScope } from "@/lib/school-scope";

export type ScheduleRowModel = {
  offer: VenueOffer;
  venue: Venue;
};

type Props = {
  quest: Pick<Quest, "slug" | "title">;
  rows: ScheduleRowModel[];
  schoolSlug?: string;
};

export function OfferScheduleTable({ quest, rows, schoolSlug }: Props) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<ScheduleRowModel | null>(null);

  const visibleRows = React.useMemo(() => {
    if (!schoolSlug) return rows;
    return rows.filter((r) =>
      venueVisibleForSchoolScope(r.venue, schoolSlug),
    );
  }, [rows, schoolSlug]);

  function openForm(row: ScheduleRowModel) {
    setActive(row);
    setOpen(true);
    trackBookingFormOpen({
      questSlug: quest.slug,
      venueSlug: row.venue.slug,
      offerId: row.offer.id,
      schoolSlug,
    });
  }

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
              const action = resolveBookingAction(row.offer.mosBookingUrl);
              return (
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
                    {action.kind === "mos" ? (
                      <a
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "border-white/15 bg-white/5 hover:bg-white/10",
                        )}
                        href={action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackBookingExternal({
                            questSlug: quest.slug,
                            venueSlug: row.venue.slug,
                            offerId: row.offer.id,
                            schoolSlug,
                          })
                        }
                      >
                        mos.ru
                      </a>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openForm(row)}
                      >
                        Записаться
                      </Button>
                    )}
                    {row.offer.includedNote ? (
                      <p className="mt-2 text-muted-foreground text-xs">
                        {row.offer.includedNote}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Заявка на программу</DialogTitle>
            <DialogDescription>
              {active
                ? `${quest.title} · ${active.venue.name} · ${active.offer.shiftLabel}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {active ? (
            <BookingForm
              defaults={{
                questSlug: quest.slug,
                questTitle: quest.title,
                offerId: active.offer.id,
                venueSlug: active.venue.slug,
                venueName: active.venue.name,
                schoolSlug,
              }}
              onSuccess={() => setOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
