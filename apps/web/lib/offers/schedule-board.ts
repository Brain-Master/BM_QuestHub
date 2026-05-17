import type { AgendaOfferItem } from "@/lib/offers/agenda";
import type { ScheduleMediaImage, VenueOffer } from "@/lib/schemas";

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
  dateLabel: string;
  timeLabel: string;
  formatType: string;
  formatNote: string | null;
  mosRuCode: string | null;
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
): ScheduleBookingMode {
  if (status === "Отменено") return { kind: "disabled", label: "Отменено" };
  if (status === "Завершено") return { kind: "disabled", label: "Завершено" };
  if (status === "Мест нет") {
    return offer.scheduleCard?.allowWaitlistWhenSoldOut
      ? { kind: "waitlist", label: "В лист ожидания" }
      : { kind: "disabled", label: "Мест нет" };
  }

  if (offer.mosBookingUrl) {
    return { kind: "mos", label: "На mos.ru", url: offer.mosBookingUrl };
  }

  if (status === "Скоро старт") return { kind: "form", label: "Оставить заявку" };
  return { kind: "form", label: "Записаться" };
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
  const hero = card?.media?.hero ?? card?.media?.fallback ?? null;
  const compact = card?.media?.compact ?? hero;
  const fallbackFromQuest = quest.catalogTagline ?? quest.tagline;
  const questHref = schoolSlug
    ? `/quests/${quest.slug}?school=${encodeURIComponent(schoolSlug)}`
    : `/quests/${quest.slug}`;

  return {
    ...item,
    displayTitle: card?.displayTitle ?? quest.title,
    description: card?.description ?? fallbackFromQuest,
    teacherName: card?.teacherName ?? null,
    tags: card?.tags.length ? card.tags : [world?.name ?? quest.worldSlug],
    dateLabel: offer.dateRange,
    timeLabel: card?.formatTime ?? `${offer.startTime}–${offer.endTime}`,
    formatType: card?.formatType ?? offer.shiftLabel,
    formatNote: card?.formatNote ?? offer.includedNote ?? null,
    mosRuCode: card?.mosRuCode ?? null,
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
    bookingMode: getScheduleBookingMode(offer, statusLabel),
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
