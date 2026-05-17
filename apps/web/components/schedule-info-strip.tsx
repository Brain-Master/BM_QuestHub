import { CalendarDays, MapPin, Train, User } from "lucide-react";

import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  item: ScheduleBoardItem;
  compact?: boolean;
  mobileDense?: boolean;
  className?: string;
};

function teacherDisplayName(name: string | null): string {
  if (!name) return "Наставник назначается";

  const firstTeacher = name.split(";")[0]?.trim() ?? name.trim();
  const parts = firstTeacher.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return firstTeacher;

  const [surname, firstName, patronymic] = parts;
  const initials = [firstName, patronymic]
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase()}.`)
    .join("");

  return initials ? `${surname} ${initials}` : surname;
}

function splitDateLabel(label: string): { first: string; second: string | null } {
  const suffixMatch = label.match(/\s+\((.+)\)$/);
  const suffix = suffixMatch?.[1];
  const base = suffix ? label.replace(/\s+\(.+\)$/, "") : label;

  const sameMonth = base.match(/^(\d+)\s*[–—-]\s*(\d+)\s+([А-Яа-яёЁ]+)$/);
  if (sameMonth) {
    return {
      first: `${sameMonth[1]}–${sameMonth[2]}`,
      second: suffix ? `${sameMonth[3]} · ${suffix}` : sameMonth[3],
    };
  }

  const crossMonth = base.match(/^(\d+\s+[А-Яа-яёЁ]+)\s*[–—-]\s*(\d+\s+[А-Яа-яёЁ]+)$/);
  if (crossMonth) {
    return {
      first: `с ${crossMonth[1]}`,
      second: `по ${crossMonth[2]}${suffix ? ` · ${suffix}` : ""}`,
    };
  }

  return { first: label, second: null };
}

function yandexMapsHref(item: ScheduleBoardItem): string {
  const query = [item.venue.name, item.venue.metro && `м. ${item.venue.metro}`, item.venue.address]
    .filter(Boolean)
    .join(", ");

  return `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
}

export function ScheduleInfoStrip({
  item,
  compact = false,
  mobileDense = false,
  className,
}: Props) {
  const teacherName = teacherDisplayName(item.teacherName);
  const dateLabel = splitDateLabel(item.shortDateLabel);
  const denseDateLabel = item.shortDateLabel.replace(/\s+\(.+\)$/, "");

  const fullStrip = (
    <div
      className={cn(
        "grid rounded-xl text-sm",
        mobileDense && "hidden sm:grid",
        compact
          ? "gap-2 px-1 py-2 lg:grid-cols-[minmax(0,1.18fr)_minmax(8rem,0.65fr)_minmax(0,0.9fr)]"
          : "gap-3 px-1 py-3 md:grid-cols-[minmax(0,1.22fr)_minmax(10rem,0.7fr)_minmax(0,0.9fr)] md:items-center",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 font-medium text-primary">
          <Train className={cn("shrink-0", compact ? "size-3.5" : "size-4")} aria-hidden />
          <span>{item.venue.name}</span>
          {item.venue.metro ? (
            <span
              className={cn(
                "text-primary/75 leading-none",
                compact ? "text-[10px]" : "text-[11px]",
              )}
            >
              м. {item.venue.metro}
            </span>
          ) : null}
        </div>
        <a
          href={yandexMapsHref(item)}
          target="_blank"
          rel="noopener noreferrer"
          className="group/location flex min-w-0 items-start gap-2 text-muted-foreground text-xs transition hover:text-foreground"
          aria-label={`Открыть адрес в Яндекс Картах: ${item.venue.address}`}
        >
          <MapPin
            className={cn("mt-0.5 shrink-0 text-primary", compact ? "size-3.5" : "size-4")}
            aria-hidden
          />
          <span className="min-w-0">
            <span className={cn(compact ? "line-clamp-1" : "line-clamp-2")}>
              {item.venue.address}
            </span>
            {item.locationNote ? (
              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/65">
                {item.locationNote}
              </span>
            ) : null}
          </span>
        </a>
      </div>

      <div
        className={cn(
          "flex min-w-0 items-center gap-3 border-white/10 border-t pt-3",
          compact
            ? "lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0"
            : "md:border-t-0 md:border-l md:pl-4 md:pt-0",
        )}
      >
        <CalendarDays className={cn("shrink-0 text-primary", compact ? "size-4" : "size-5")} aria-hidden />
        <span className="min-w-0 text-center">
          <span className="block leading-tight">
            <span className="block">{dateLabel.first}</span>
            {dateLabel.second ? (
              <span className="block text-muted-foreground/80">
                {dateLabel.second}
              </span>
            ) : null}
          </span>
        </span>
      </div>

      <div
        className={cn(
          "flex min-w-0 items-center gap-3 border-white/10 border-t pt-3",
          compact
            ? "lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0"
            : "md:border-t-0 md:border-l md:pl-4 md:pt-0",
        )}
      >
        <User className={cn("shrink-0 text-primary", compact ? "size-4" : "size-5")} aria-hidden />
        <span className="min-w-0">
          <span className="block text-muted-foreground text-xs">Наставник</span>
          <span className="block leading-tight" title={item.teacherName ?? undefined}>
            {teacherName}
          </span>
        </span>
      </div>
    </div>
  );

  if (!mobileDense) return fullStrip;

  return (
    <>
      <div className={cn("grid gap-1.5 rounded-xl text-xs sm:hidden", className)}>
        <div className="grid gap-1.5">
          <span className="inline-flex items-start gap-1.5 font-medium text-primary">
            <Train className="size-3.5 shrink-0" aria-hidden />
            <span className="leading-snug">{item.venue.name}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <CalendarDays className="size-3.5 text-primary" aria-hidden />
            {denseDateLabel}
          </span>
        </div>
      </div>
      {fullStrip}
    </>
  );
}
