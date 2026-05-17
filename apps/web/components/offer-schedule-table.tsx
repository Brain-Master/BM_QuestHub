"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, School } from "lucide-react";

import { FilterDisclosure } from "@/components/filter-disclosure";
import { OfferBookingAction } from "@/components/offer-booking-action";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const schoolSlug = searchParams.get("school")?.trim() || undefined;
  const offerId = searchParams.get("offer")?.trim() || undefined;
  const variantId = searchParams.get("variant")?.trim() || undefined;

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

  function pushSchoolFilter(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("offer");
    params.delete("variant");
    if (value?.trim()) {
      params.set("school", value.trim());
    } else {
      params.delete("school");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-4">
      <FilterDisclosure
        title="Фильтры расписания"
        summary="Площадка для записи"
        panelId="quest-schedule-filter-panel"
        activeCount={schoolSlug ? 1 : 0}
        contentClassName="flex flex-col gap-3 md:flex-row md:items-end"
      >
        <label className="grid min-w-0 flex-1 gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <School className="size-4 opacity-80" aria-hidden />
            Школьный скоуп
          </span>
          <input
            key={schoolSlug ?? "none"}
            className="h-10 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-foreground shadow-inner outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
            defaultValue={schoolSlug}
            placeholder="например school-1212"
            name="quest-schedule-school"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                pushSchoolFilter((event.target as HTMLInputElement).value);
              }
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="border border-white/5 bg-white/5 hover:bg-white/10"
            onClick={() => {
              const input = document.querySelector(
                "input[name=quest-schedule-school]",
              ) as HTMLInputElement | null;
              pushSchoolFilter(input?.value ?? null);
            }}
          >
            Применить
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-transparent hover:bg-white/5"
            onClick={() => pushSchoolFilter(null)}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Сбросить
          </Button>
        </div>
      </FilterDisclosure>

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
                        <div
                          key={variant.id}
                          className={cn(
                            "rounded-lg p-1.5 text-xs transition-colors",
                            variantId === variant.id &&
                              "bg-primary/10 text-primary ring-1 ring-primary/35",
                          )}
                        >
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
                        <div
                          key={variant.id}
                          className={cn(
                            "rounded-lg px-1.5 py-1",
                            variantId === variant.id && "bg-primary/10 text-primary",
                          )}
                        >
                          {variant.priceLabel}
                        </div>
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
