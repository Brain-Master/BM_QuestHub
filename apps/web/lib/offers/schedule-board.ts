import type { AgendaOfferItem } from "@/lib/offers/agenda";
import type { ScheduleMediaImage, ScheduleVariant, VenueOffer } from "@/lib/schemas";

export type ScheduleDisplayStatus =
  | "Идёт набор"
  | "Скоро старт"
  | "Можно присоединиться"
  | "Мест нет"
  | "Завершено"
  | "Отменено";

export type ScheduleStatusVariant =
  | "success"
  | "info"
  | "purple"
  | "warning"
  | "default"
  | "destructive";

export type ScheduleBookingMode =
  | { kind: "form"; label: string }
  | { kind: "mos"; label: string; url: string }
  | { kind: "waitlist"; label: string }
  | { kind: "disabled"; label: string };

export type ScheduleBoardVariant = {
  id: string;
  type: string;
  time: string;
  priceLabel: string;
  note: string | null;
  ageLabel: string | null;
  mosRuCode: string | null;
  bookingMode: ScheduleBookingMode;
};

export type ScheduleCapacityView = {
  total: number;
  booked: number;
  left: number;
  percent: number;
  isLow: boolean;
  isSoldOut: boolean;
  label: string;
} | null;

export type ScheduleBoardItem = AgendaOfferItem & {
  displayTitle: string;
  description: string;
  teacherName: string | null;
  tags: string[];
  timelineDateLabel: string;
  shortDateLabel: string;
  shiftNumber: string | null;
  locationNote: string | null;
  programFilterLabel: string;
  commonAgeLabel: string | null;
  dateLabel: string;
  timeLabel: string;
  formatType: string;
  formatNote: string | null;
  mosRuCode: string | null;
  variants: ScheduleBoardVariant[];
  media: {
    hero: ScheduleMediaImage | null;
    compact: ScheduleMediaImage | null;
  };
  status: {
    label: ScheduleDisplayStatus;
    variant: ScheduleStatusVariant;
    isArchivedState: boolean;
    isSoldOut: boolean;
    isPlanning: boolean;
    isCancelled: boolean;
  };
  capacity: ScheduleCapacityView;
  bookingMode: ScheduleBookingMode;
  questHref: string;
};

const PLANNING_STATUSES = new Set(["Планируется", "Согласование"]);
const RU_MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

function endOfLocalDate(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59`);
}

export function isOfferAutoArchived(
  offer: Pick<VenueOffer, "endDate">,
  now = new Date(),
): boolean {
  return now > endOfLocalDate(offer.endDate);
}

export function getScheduleCapacity(
  offer: Pick<VenueOffer, "enrolled" | "maxCapacity">,
): ScheduleCapacityView {
  if (
    typeof offer.enrolled !== "number" ||
    typeof offer.maxCapacity !== "number"
  ) {
    return null;
  }

  const total = offer.maxCapacity;
  const booked = Math.min(offer.enrolled, total);
  const left = Math.max(total - booked, 0);
  const percent = Math.min(Math.round((booked / total) * 100), 100);
  const isSoldOut = left <= 0;
  const isLow = left > 0 && left <= 5;

  return {
    total,
    booked,
    left,
    percent,
    isLow,
    isSoldOut,
    label: isSoldOut ? "Мест нет" : `Осталось ${formatPlaces(left)}`,
  };
}

export function getScheduleDisplayStatus(
  offer: VenueOffer,
  now = new Date(),
): ScheduleDisplayStatus {
  const rawStatus = offer.scheduleCard?.status ?? offer.sheetStatus ?? "";
  const isCancelled = rawStatus === "Отменено";
  const isArchivedState =
    offer.scheduleCard?.isArchived === true ||
    isOfferAutoArchived(offer, now) ||
    isCancelled;
  const capacity = getScheduleCapacity(offer);
  const isSoldOut = capacity?.isSoldOut === true || rawStatus === "Мест нет";

  if (isCancelled) return "Отменено";
  if (isArchivedState) return "Завершено";
  if (rawStatus === "Можно присоединиться") return "Можно присоединиться";
  if (PLANNING_STATUSES.has(rawStatus)) return "Скоро старт";
  if (isSoldOut) return "Мест нет";
  return "Идёт набор";
}

export function getScheduleStatusVariant(
  status: ScheduleDisplayStatus,
): ScheduleStatusVariant {
  if (status === "Отменено") return "destructive";
  if (status === "Завершено") return "default";
  if (status === "Можно присоединиться") return "purple";
  if (status === "Скоро старт") return "info";
  if (status === "Мест нет") return "warning";
  return "success";
}

export function getScheduleBookingMode(
  offer: VenueOffer,
  status: ScheduleDisplayStatus,
  variant?: Pick<ScheduleVariant, "mosBookingUrl">,
): ScheduleBookingMode {
  if (status === "Отменено") return { kind: "disabled", label: "Отменено" };
  if (status === "Завершено") return { kind: "disabled", label: "Завершено" };
  if (status === "Мест нет") {
    return offer.scheduleCard?.allowWaitlistWhenSoldOut
      ? { kind: "waitlist", label: "В лист ожидания" }
      : { kind: "disabled", label: "Мест нет" };
  }

  const mosBookingUrl = variant?.mosBookingUrl ?? offer.mosBookingUrl;
  if (mosBookingUrl) {
    return { kind: "mos", label: "Записаться (Mos.ru)", url: mosBookingUrl };
  }

  if (status === "Скоро старт") {
    return { kind: "waitlist", label: "Узнать о старте" };
  }
  return { kind: "form", label: "Записаться" };
}

export function formatScheduleDateRange(start: string, end: string): string {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) return `${start} – ${end}`;

  const startDay = startDate.getUTCDate();
  const endDay = endDate.getUTCDate();
  const startMonth = startDate.getUTCMonth();
  const endMonth = endDate.getUTCMonth();

  if (start === end) return `${startDay} ${RU_MONTHS[startMonth]}`;
  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${RU_MONTHS[startMonth]}`;
  }
  return `${startDay} ${RU_MONTHS[startMonth]} – ${endDay} ${RU_MONTHS[endMonth]}`;
}

function parseIsoDate(iso: string): Date | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function buildQuestHref(questSlug: string, offerId: string, schoolSlug?: string): string {
  const params = new URLSearchParams();
  if (schoolSlug) params.set("school", schoolSlug);
  params.set("offer", offerId);
  const query = params.toString();
  return `/quests/${questSlug}${query ? `?${query}` : ""}#schedule-offers`;
}

function normalizeVariants(
  offer: VenueOffer,
  status: ScheduleDisplayStatus,
): ScheduleBoardVariant[] {
  const source =
    offer.scheduleCard?.variants && offer.scheduleCard.variants.length > 0
      ? offer.scheduleCard.variants
      : [
          {
            id: offer.id,
            type: offer.scheduleCard?.formatType ?? offer.shiftLabel,
            time:
              offer.scheduleCard?.formatTime ??
              `Пн-Пт, ${offer.startTime}–${offer.endTime}`,
            priceLabel: offer.priceLabel,
            note:
              offer.scheduleCard?.formatNote ??
              offer.includedNote ??
              null,
            ageLabel: offer.scheduleCard?.ageLabel ?? null,
            mosRuCode: offer.scheduleCard?.mosRuCode ?? null,
            mosBookingUrl: offer.mosBookingUrl ?? undefined,
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
    bookingMode: getScheduleBookingMode(offer, status, variant),
  }));
}

function getCommonAgeLabel(
  variants: ScheduleBoardVariant[],
  fallback: string | undefined,
): string | null {
  const labels = variants
    .map((variant) => variant.ageLabel?.trim())
    .filter((label): label is string => Boolean(label));
  if (labels.length === variants.length && new Set(labels).size === 1) {
    return labels[0];
  }
  return fallback?.trim() || null;
}

export function buildScheduleBoardItem(
  item: AgendaOfferItem,
  schoolSlug?: string,
  now = new Date(),
): ScheduleBoardItem {
  const { offer, quest, world } = item;
  const card = offer.scheduleCard;
  const statusLabel = getScheduleDisplayStatus(offer, now);
  const capacity = getScheduleCapacity(offer);
  const variants = normalizeVariants(offer, statusLabel);
  const commonAgeLabel = getCommonAgeLabel(variants, card?.ageLabel ?? quest.ageLabel);
  const hero = card?.media?.hero ?? card?.media?.fallback ?? null;
  const compact = card?.media?.compact ?? hero;
  const fallbackFromQuest = quest.catalogTagline ?? quest.tagline;
  const questHref = buildQuestHref(quest.slug, offer.id, schoolSlug);
  const dateLabel = card?.shortDate ?? formatScheduleDateRange(offer.startDate, offer.endDate);
  const primaryVariant = variants[0];

  return {
    ...item,
    displayTitle: card?.displayTitle ?? quest.title,
    description: card?.description ?? fallbackFromQuest,
    teacherName: card?.teacherName ?? null,
    timelineDateLabel:
      card?.timelineDate ?? formatScheduleDateRange(offer.startDate, offer.endDate),
    shortDateLabel: dateLabel,
    shiftNumber: card?.shiftNumber ?? null,
    locationNote: card?.locationNote ?? null,
    programFilterLabel: card?.programFilterLabel ?? quest.title,
    commonAgeLabel,
    tags: card?.tags.length ? card.tags : [world?.name ?? quest.worldSlug],
    dateLabel,
    timeLabel: primaryVariant?.time ?? `${offer.startTime}–${offer.endTime}`,
    formatType: primaryVariant?.type ?? offer.shiftLabel,
    formatNote: primaryVariant?.note ?? null,
    mosRuCode: card?.mosRuCode ?? primaryVariant?.mosRuCode ?? null,
    variants,
    media: {
      hero:
        hero ??
        (quest.heroImageUrl
          ? { url: quest.heroImageUrl, alt: quest.title }
          : null),
      compact:
        compact ??
        (quest.heroImageUrl
          ? { url: quest.heroImageUrl, alt: quest.title }
          : null),
    },
    status: {
      label: statusLabel,
      variant: getScheduleStatusVariant(statusLabel),
      isArchivedState: statusLabel === "Завершено" || statusLabel === "Отменено",
      isSoldOut: statusLabel === "Мест нет",
      isPlanning: statusLabel === "Скоро старт",
      isCancelled: statusLabel === "Отменено",
    },
    capacity,
    bookingMode: primaryVariant?.bookingMode ?? getScheduleBookingMode(offer, statusLabel),
    questHref,
  };
}

function formatPlaces(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} место`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} места`;
  }
  return `${count} мест`;
}
