"use client";

import Link from "next/link";
import { Building2, CalendarDays, ChevronDown, Clock, Users } from "lucide-react";

import { OfferBookingAction } from "@/components/offer-booking-action";
import { ScheduleStatusBadge } from "@/components/schedule-status-badge";
import { Badge } from "@/components/ui/badge";
import type {
  ScheduleBoardItem,
  ScheduleBoardVariant,
} from "@/lib/offers/schedule-board";
import { buildVenueSiteHref } from "@/lib/sites/site-route";
import { cn } from "@/lib/utils";

type Props = {
  item: ScheduleBoardItem;
  schoolSlug?: string;
  bookingSchoolSlug?: string;
  expanded?: boolean;
  highlighted?: boolean;
  onExpandChange?: (expanded: boolean, anchor: HTMLElement | null) => void;
  onNavigate?: () => void;
};

function hrefWithVariant(href: string, variantId: string): string {
  const [pathAndQuery, hash] = href.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);
  params.set("variant", variantId);
  const nextQuery = params.toString();
  return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

function parsePriceValue(label: string): number | null {
  const digits = label.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function priceSummary(variants: ScheduleBoardVariant[]): string {
  if (variants.length <= 1) return variants[0]?.priceLabel ?? "Цена уточняется";

  const cheapest = variants
    .map((variant) => parsePriceValue(variant.priceLabel))
    .filter((price): price is number => price !== null)
    .sort((a, b) => a - b)[0];

  return cheapest ? `от ${cheapest.toLocaleString("ru-RU")} ₽` : `от ${variants[0].priceLabel}`;
}

export function ScheduleBoardCardMobile({
  item,
  schoolSlug,
  bookingSchoolSlug,
  expanded = false,
  highlighted = false,
  onExpandChange,
  onNavigate,
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
          registrationChannel: item.registrationChannel,
          allowPreliminaryRegistration: item.allowPreliminaryRegistration,
          bookingMode: item.bookingMode,
        },
      ];
  const image = item.media.compact ?? item.media.hero;
  const price = priceSummary(variants);
  const showSchool = !schoolSlug;

  return (
    <article
      id={`schedule-offer-${item.offer.id}`}
      data-testid="schedule-card"
      className={cn(
        "overflow-hidden rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-card-bg)] shadow-[var(--schedule-card-shadow)] backdrop-blur-md transition",
        highlighted && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3 p-2.5 transition hover:bg-white/[0.03]">
        <Link
          href={item.questHref}
          aria-label={`Открыть ${item.displayTitle}`}
          className="relative min-h-32 overflow-hidden rounded-xl bg-gradient-to-br from-primary/25 via-card to-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onNavigate}
        >
          {image ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("${image.url.replace(/"/g, '\\"')}")`,
                backgroundPosition: image.focalPoint
                  ? `${image.focalPoint.x}% ${image.focalPoint.y}%`
                  : "50% 50%",
              }}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-2 left-2">
            <ScheduleStatusBadge
              label={item.status.label}
              variant={item.status.variant}
              className="h-6 px-2 text-[10px]"
            />
          </div>
        </Link>

        <div className="min-w-0 py-1 pr-1">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {item.programNameH1 ? (
            <Badge variant="outline" className="border-white/10 bg-black/20 px-2 py-0.5 text-[10px]">
              {item.programNameH1}
            </Badge>
            ) : null}
          </div>
          <h3 className="font-heading text-base font-semibold leading-tight text-foreground">
            <Link
              href={item.questHref}
              className="rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onNavigate}
            >
              {item.programNameH2 ?? item.displayTitle}
            </Link>
          </h3>
          <div className="mt-2 grid gap-1.5 text-muted-foreground text-xs">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{item.shortDateLabel}</span>
            </span>
            {showSchool ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Building2 className="size-3.5 shrink-0 text-primary" aria-hidden />
                <Link
                  href={buildVenueSiteHref(item.venue)}
                  className="truncate rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.venue.name}
                </Link>
              </span>
            ) : null}
            {item.commonAgeLabel ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Users className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{item.commonAgeLabel}</span>
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-heading text-lg font-semibold text-foreground">
              {price}
            </span>
            {variants.length > 1 ? (
              <Badge variant="outline" className="border-white/10 bg-black/20 text-[10px]">
                {variants.length} формата
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-white/10 border-t px-2.5 py-2">
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 font-medium text-sm text-primary transition hover:bg-white/5"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onExpandChange?.(!expanded, event.currentTarget);
          }}
          aria-expanded={expanded}
        >
          {expanded ? "Скрыть форматы" : "Показать форматы / группы"}
          <ChevronDown
            className={cn("size-4 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-white/10 border-t transition-[grid-template-rows,opacity] duration-300 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <div className="grid gap-2 p-2.5">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <Link
                  href={hrefWithVariant(item.questHref, variant.id)}
                  className="block rounded-lg outline-none transition hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={onNavigate}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug text-foreground">
                        {variant.type}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Clock className="size-3.5 text-primary" aria-hidden />
                        {variant.time}
                      </p>
                      {variant.note ? (
                        <p className="mt-2 line-clamp-2 text-muted-foreground text-xs">
                          {variant.note}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-heading font-semibold text-foreground">
                      {variant.priceLabel}
                    </span>
                  </div>
                </Link>
                <OfferBookingAction
                  quest={item.quest}
                  offer={item.offer}
                  venue={item.venue}
                  schoolSlug={bookingSchoolSlug ?? schoolSlug}
                  mode={variant.bookingMode}
                  variant={variant}
                  className="mt-3"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
