import { Clock, Info } from "lucide-react";

import { OfferBookingAction } from "@/components/offer-booking-action";
import type {
  ScheduleBoardItem,
  ScheduleBoardVariant,
} from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  item: ScheduleBoardItem;
  schoolSlug?: string;
  compact?: boolean;
  mobileDense?: boolean;
  className?: string;
};

type TariffRowProps = {
  item: ScheduleBoardItem;
  variant: ScheduleBoardVariant;
  schoolSlug?: string;
};

function FormatNote({
  note,
  compact = false,
}: {
  note: string | null;
  compact?: boolean;
}) {
  if (!note) return null;

  return (
    <p
      className={cn(
        "mt-2 flex gap-1.5 text-muted-foreground text-xs leading-relaxed",
        compact && "text-[11px]",
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
      <span className={cn(compact ? "line-clamp-2" : "line-clamp-3")}>
        {note}
      </span>
    </p>
  );
}

function TimePill({
  time,
  compact = false,
}: {
  time: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 text-muted-foreground text-xs",
        compact ? "px-2 py-1" : "px-2.5 py-1.5",
      )}
    >
      <Clock className="size-3.5 text-primary" aria-hidden />
      {time}
    </span>
  );
}

function MosRuCode({ code }: { code: string | null }) {
  return (
    <p
      className={cn(
        "min-h-3.5 text-left text-muted-foreground text-[11px] leading-tight lg:text-right",
        !code && "invisible",
      )}
      aria-hidden={!code}
    >
      Код mos.ru: <span className="text-foreground/85">{code ?? "0000000"}</span>
    </p>
  );
}

function CompactTariffRow({ item, variant, schoolSlug }: TariffRowProps) {
  return (
    <div
      data-testid="schedule-tariff-row"
      className="grid gap-2 rounded-xl border border-white/7 bg-white/[0.035] px-3 py-2.5 lg:grid-cols-[minmax(0,1fr)_9.5rem_11rem] lg:items-start"
    >
      <div className="min-w-0">
        <p className="font-medium text-sm leading-snug text-foreground">
          {variant.type}
        </p>
        {!item.commonAgeLabel && variant.ageLabel ? (
          <span className="mt-1.5 inline-flex rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-primary text-xs">
            {variant.ageLabel}
          </span>
        ) : null}
        <FormatNote note={variant.note} compact />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 lg:grid lg:justify-items-end">
        <TimePill time={variant.time} compact />
        <div className="font-heading font-semibold text-base text-foreground lg:w-24 lg:text-right">
          {variant.priceLabel}
        </div>
      </div>

      <div className="grid min-w-0 gap-1 lg:justify-items-end">
        <MosRuCode code={variant.mosRuCode} />
        <OfferBookingAction
          quest={item.quest}
          offer={item.offer}
          venue={item.venue}
          schoolSlug={schoolSlug}
          mode={variant.bookingMode}
          variant={variant}
          compact
          className="w-full lg:w-auto"
        />
      </div>
    </div>
  );
}

function DenseMobileTariffRow({ item, variant, schoolSlug }: TariffRowProps) {
  return (
    <div
      data-testid="schedule-tariff-row"
      className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-2"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-1 font-medium text-foreground text-sm leading-snug">
            {variant.type}
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-[11px]">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Clock className="size-3 text-primary" aria-hidden />
              <span className="truncate">{variant.time}</span>
            </span>
            {!item.commonAgeLabel && variant.ageLabel ? (
              <span className="rounded-full border border-white/10 bg-black/20 px-1.5 py-0.5 text-primary">
                {variant.ageLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid shrink-0 justify-items-end gap-0.5 text-right">
          <div className="font-heading font-semibold text-foreground text-sm">
            {variant.priceLabel}
          </div>
          {variant.mosRuCode ? (
            <p className="text-[10px] text-muted-foreground leading-tight">
              Код: <span className="text-foreground/85">{variant.mosRuCode}</span>
            </p>
          ) : null}
        </div>
      </div>

      {variant.note ? (
        <p className="line-clamp-1 text-muted-foreground text-[11px] leading-snug">
          {variant.note}
        </p>
      ) : null}

      <div className="grid min-w-0">
        <OfferBookingAction
          quest={item.quest}
          offer={item.offer}
          venue={item.venue}
          schoolSlug={schoolSlug}
          mode={variant.bookingMode}
          variant={variant}
          compact
          className="w-full"
        />
      </div>
    </div>
  );
}

function DetailedTariffRow({ item, variant, schoolSlug }: TariffRowProps) {
  return (
    <div
      data-testid="schedule-tariff-row"
      className="grid gap-3 rounded-xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-tariff-bg)] p-4 lg:grid-cols-[1fr_12rem_auto] lg:items-center"
    >
      <div className="min-w-0">
        <p className="font-medium leading-snug text-foreground">{variant.type}</p>
        {!item.commonAgeLabel && variant.ageLabel ? (
          <p className="mt-1 text-primary text-xs">{variant.ageLabel}</p>
        ) : null}
        <FormatNote note={variant.note} />
      </div>

      <div className="hidden items-center justify-center border-white/10 border-l pl-4 text-muted-foreground text-xs lg:flex">
        <TimePill time={variant.time} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-white/10 border-t pt-3 lg:justify-end lg:border-t-0 lg:pt-0">
        <div className="font-heading font-semibold text-foreground text-lg">
          {variant.priceLabel}
        </div>
        <div className="grid gap-1.5 justify-items-end">
          <MosRuCode code={variant.mosRuCode} />
          <OfferBookingAction
            quest={item.quest}
            offer={item.offer}
            venue={item.venue}
            schoolSlug={schoolSlug}
            mode={variant.bookingMode}
            variant={variant}
          />
        </div>
      </div>
    </div>
  );
}

export function ScheduleTariffList({
  item,
  schoolSlug,
  compact = false,
  mobileDense = false,
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
          registrationChannel: item.registrationChannel,
          allowPreliminaryRegistration: item.allowPreliminaryRegistration,
          bookingMode: item.bookingMode,
        },
      ];

  if (mobileDense) {
    return (
      <div data-testid="schedule-tariffs" className={cn("grid", className)}>
        <div className="grid gap-1.5 sm:hidden">
          {variants.map((variant) => (
            <DenseMobileTariffRow
              key={variant.id}
              item={item}
              variant={variant}
              schoolSlug={schoolSlug}
            />
          ))}
        </div>
        <div className="hidden gap-1 sm:grid">
          {variants.map((variant) => (
            <CompactTariffRow
              key={variant.id}
              item={item}
              variant={variant}
              schoolSlug={schoolSlug}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="schedule-tariffs"
      className={cn("grid", compact ? "gap-1" : "gap-3", className)}
    >
      {variants.map((variant) =>
        compact ? (
          <CompactTariffRow
            key={variant.id}
            item={item}
            variant={variant}
            schoolSlug={schoolSlug}
          />
        ) : (
          <DetailedTariffRow
            key={variant.id}
            item={item}
            variant={variant}
            schoolSlug={schoolSlug}
          />
        ),
      )}
    </div>
  );
}
