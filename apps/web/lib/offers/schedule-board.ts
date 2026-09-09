import type { EventStatusV2 } from "@/lib/data/v2/entities";
import { annualBookingNeedsReview } from "./annual-schedule";
import type { AgendaOfferItem } from "@/lib/offers/agenda";
import {
  CAPACITY_LABELS,
  eventStatusLabel,
  eventStatusVariant,
  rawSheetStatusToKey,
  SCHEDULE_CTA,
  SHEET_PLANNING_STATUSES,
} from "@/lib/offers/schedule-dictionaries";
import type { ScheduleStatusVariant } from "@/lib/offers/schedule-dictionaries";
import type {
  RegistrationChannel,
  ScheduleMediaImage,
  ScheduleVariant,
  VenueOffer,
} from "@/lib/schemas";
import {
  aggregateVariantEnrolled,
  formatVariantTimeLabel,
  normalizeEnrolledHeadcount,
} from "@/lib/offers/sheet-field-parsers";
import { joinProgramName } from "@/lib/offers/program-name";
import {
  coalesceScheduleMediaImage,
  questHeroMediaImage,
} from "@/lib/media/schedule-media-coalesce";

export type { ScheduleStatusVariant };

export type ScheduleDisplayStatus =
  | "Идёт набор"
  | "Скоро старт"
  | "Можно присоединиться"
  | "Мест нет"
  | "Завершено"
  | "Отменено"
  | "Приём закрыт";
// Admission is a dated source fact, separate from lifecycle status.

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
  registrationChannel: RegistrationChannel;
  allowPreliminaryRegistration: boolean;
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
  programNameH1: string | null;
  programNameH2: string | null;
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
  registrationChannel: RegistrationChannel;
  allowPreliminaryRegistration: boolean;
  allowWaitlistWhenSoldOut: boolean;
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

export function getOfferEnrolledTotal(
  offer: Pick<VenueOffer, "enrolled" | "maxCapacity" | "scheduleCard">,
): number | undefined {
  const maxCapacity = offer.maxCapacity;
  const fromVariants = aggregateVariantEnrolled(
    offer.scheduleCard?.variants ?? [],
    maxCapacity,
  );
  if (fromVariants !== undefined) {
    return fromVariants;
  }
  return normalizeEnrolledHeadcount(offer.enrolled, maxCapacity);
}

export function getScheduleCapacity(
  offer: Pick<VenueOffer, "enrolled" | "maxCapacity" | "scheduleCard">,
): ScheduleCapacityView {
  if (typeof offer.maxCapacity !== "number") {
    return null;
  }

  const total = offer.maxCapacity;
  const enrolled = getOfferEnrolledTotal(offer);

  if (typeof enrolled !== "number") {
    return {
      total,
      booked: 0,
      left: total,
      percent: 0,
      isLow: false,
      isSoldOut: false,
      label: `${CAPACITY_LABELS.remainingPrefix} ${formatPlaces(total)}`,
    };
  }

  const booked = Math.min(enrolled, total);
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
    label: isSoldOut
      ? CAPACITY_LABELS.soldOut
      : `${CAPACITY_LABELS.remainingPrefix} ${formatPlaces(left)}`,
  };
}

export function resolveScheduleStatusKey(
  offer: VenueOffer,
  now = new Date(),
): EventStatusV2 {
  const rawStatus = offer.scheduleCard?.status ?? offer.sheetStatus ?? "";
  const mapped = rawSheetStatusToKey(rawStatus);
  const cancelledLabel = eventStatusLabel("cancelled");
  const soldOutLabel = eventStatusLabel("sold_out");

  const isCancelled =
    mapped === "cancelled" || rawStatus === cancelledLabel || rawStatus === "Отменено";
  const isArchivedState =
    offer.scheduleCard?.isArchived === true ||
    isOfferAutoArchived(offer, now) ||
    isCancelled;
  const enrolled = getOfferEnrolledTotal(offer);
  const capacity = getScheduleCapacity(offer);
  const isSoldOut =
    (typeof enrolled === "number" && capacity?.isSoldOut === true) ||
    mapped === "sold_out" ||
    rawStatus === soldOutLabel ||
    rawStatus === "Мест нет";

  if (isCancelled) return "cancelled";
  if (isArchivedState) return "finished";
  if (mapped === "join_late") return "join_late";
  if (SHEET_PLANNING_STATUSES.has(rawStatus)) return "planning";
  if (isSoldOut) return "sold_out";
  if (mapped) return mapped;
  return "recruiting";
}

export function getScheduleDisplayStatus(
  offer: VenueOffer,
  now = new Date(),
): ScheduleDisplayStatus {
  if (offer.annual?.admission === "closed" && !isOfferAutoArchived(offer, now)) return "Приём закрыт";
  return eventStatusLabel(resolveScheduleStatusKey(offer, now)) as ScheduleDisplayStatus;
}

export function getScheduleStatusVariant(
  offer: VenueOffer,
  now = new Date(),
): ScheduleStatusVariant {
  if (offer.annual?.admission === "closed") return "default";
  return eventStatusVariant(resolveScheduleStatusKey(offer, now));
}

export function getScheduleBookingMode(
  offer: VenueOffer,
  status: ScheduleDisplayStatus,
  variant?: Pick<ScheduleVariant, "mosBookingUrl">,
): ScheduleBookingMode {
  if (annualBookingNeedsReview(offer.annual)) return { kind: "disabled", label: "Карточка на проверке" };
  if (offer.annual?.admission === "closed") return { kind: "disabled", label: "Приём закрыт" };
  const statusKey = resolveScheduleStatusKey(offer);
  const cta = SCHEDULE_CTA;

  if (statusKey === "cancelled") {
    return { kind: "disabled", label: cta.cancelledDisabled };
  }
  if (statusKey === "finished") {
    return { kind: "disabled", label: cta.finishedDisabled };
  }
  if (statusKey === "sold_out") {
    return offer.scheduleCard?.allowWaitlistWhenSoldOut
      ? { kind: "waitlist", label: cta.waitlist }
      : { kind: "disabled", label: cta.soldOutDisabled };
  }

  const mosBookingUrl = variant?.mosBookingUrl ?? offer.mosBookingUrl;
  if (mosBookingUrl) {
    return { kind: "mos", label: cta.bookMos, url: mosBookingUrl };
  }

  if (statusKey === "planning") {
    return { kind: "waitlist", label: cta.preliminary };
  }
  return { kind: "form", label: cta.book };
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

function buildQuestHref(questSlug: string, offerId: string, schoolSlug?: string, venueSlug?: string): string {
  const params = new URLSearchParams();
  if (schoolSlug) params.set("school", schoolSlug);
  if (venueSlug) params.set("venue", venueSlug);
  params.set("offer", offerId);
  const query = params.toString();
  return `/quests/${questSlug}${query ? `?${query}` : ""}#schedule-offers`;
}

function getRegistrationChannel(offer: VenueOffer): RegistrationChannel {
  return offer.scheduleCard?.registrationChannel ?? (offer.mosBookingUrl ? "mos_ru" : "brainmaster");
}

function getAllowPreliminaryRegistration(
  offer: VenueOffer,
  statusKey: EventStatusV2,
  variant?: ScheduleVariant,
): boolean {
  if (typeof variant?.allowPreliminaryRegistration === "boolean") {
    return variant.allowPreliminaryRegistration;
  }
  return (
    offer.scheduleCard?.allowPreliminaryRegistration === true ||
    statusKey === "planning" ||
    (statusKey === "sold_out" && offer.scheduleCard?.allowWaitlistWhenSoldOut === true)
  );
}

function variantRegistrationChannel(
  variant: ScheduleVariant,
  offer: VenueOffer,
): RegistrationChannel {
  return (
    variant.registrationChannel ??
    offer.scheduleCard?.registrationChannel ??
    (offer.mosBookingUrl ? "mos_ru" : "brainmaster")
  );
}

function variantAllowPreliminary(
  variant: ScheduleVariant,
  offer: VenueOffer,
  statusKey: EventStatusV2,
): boolean {
  return getAllowPreliminaryRegistration(offer, statusKey, variant);
}

function normalizeVariants(
  offer: VenueOffer,
  statusKey: EventStatusV2,
  statusLabel: ScheduleDisplayStatus,
): ScheduleBoardVariant[] {
  const fallbackTime = formatVariantTimeLabel(
    offer.startDate,
    offer.endDate,
    offer.startTime,
    offer.endTime,
  );
  const source =
    offer.scheduleCard?.variants && offer.scheduleCard.variants.length > 0
      ? offer.scheduleCard.variants
      : [
          {
            id: offer.id,
            type: offer.scheduleCard?.formatType ?? offer.shiftLabel,
            time: fallbackTime,
            priceLabel: offer.priceLabel,
            note:
              offer.scheduleCard?.formatNote ??
              offer.includedNote ??
              undefined,
            ageLabel: offer.scheduleCard?.ageLabel,
            mosRuCode: offer.scheduleCard?.mosRuCode,
            mosBookingUrl: offer.mosBookingUrl ?? undefined,
            registrationChannel: offer.scheduleCard?.registrationChannel,
            allowPreliminaryRegistration:
              offer.scheduleCard?.allowPreliminaryRegistration,
          },
        ];

  return source.map((variant) => ({
    id: variant.id,
    type: variant.type,
    time: variant.time?.trim() ? variant.time : fallbackTime,
    priceLabel: variant.priceLabel,
    note: variant.note?.trim() ? variant.note : null,
    ageLabel: variant.ageLabel?.trim() ? variant.ageLabel : null,
    mosRuCode: variant.mosRuCode?.trim() ? variant.mosRuCode : null,
    registrationChannel: variantRegistrationChannel(variant, offer),
    allowPreliminaryRegistration: variantAllowPreliminary(
      variant,
      offer,
      statusKey,
    ),
    bookingMode: getScheduleBookingMode(offer, statusLabel, variant),
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
  resolveMedia = coalesceScheduleMediaImage,
): ScheduleBoardItem {
  const { offer, quest, world } = item;
  const card = offer.scheduleCard;
  const statusKey = resolveScheduleStatusKey(offer, now);
  const statusLabel = getScheduleDisplayStatus(offer, now);
  const capacity = getScheduleCapacity(offer);
  const variants = normalizeVariants(offer, statusKey, statusLabel);
  const commonAgeLabel = getCommonAgeLabel(variants, card?.ageLabel ?? quest.ageLabel);
  const questHeroFallback = questHeroMediaImage(quest);
  const hero = resolveMedia(
    card?.media?.hero ?? card?.media?.fallback ?? null,
    questHeroFallback,
  );
  const compact = resolveMedia(
    card?.media?.compact ?? null,
    hero ?? questHeroFallback,
  );
  const fallbackFromQuest = quest.catalogTagline ?? quest.tagline;
  const questHref = buildQuestHref(quest.slug, offer.id, schoolSlug, quest.format === "year" ? offer.venueSlug : undefined);
  const dateLabel = card?.shortDate ?? formatScheduleDateRange(offer.startDate, offer.endDate);
  const primaryVariant = variants[0];
  const programNameH1 = card?.programNameH1?.trim() || null;
  const programNameH2 = card?.programNameH2?.trim() || null;
  const joinedProgram = joinProgramName(programNameH1 ?? undefined, programNameH2 ?? undefined);

  return {
    ...item,
    displayTitle: card?.displayTitle ?? (joinedProgram || quest.title),
    programNameH1,
    programNameH2,
    description: card?.description ?? fallbackFromQuest,
    teacherName: card?.teacherName ?? null,
    timelineDateLabel:
      card?.timelineDate ?? formatScheduleDateRange(offer.startDate, offer.endDate),
    shortDateLabel: dateLabel,
    shiftNumber: card?.shiftNumber ?? null,
    locationNote: card?.locationNote ?? null,
    programFilterLabel: quest.format === "year" ? quest.title : card?.programFilterLabel ?? (joinedProgram || quest.title),
    commonAgeLabel,
    tags: card?.tags.length ? card.tags : [world?.name ?? quest.worldSlug],
    dateLabel,
    timeLabel: offer.weeklySlots?.map(s => `${s.weekday}: ${s.start}–${s.end}`).join("; ") ?? primaryVariant?.time ?? `${offer.startTime}–${offer.endTime}`,
    formatType: primaryVariant?.type ?? offer.shiftLabel,
    formatNote: primaryVariant?.note ?? null,
    mosRuCode: card?.mosRuCode ?? primaryVariant?.mosRuCode ?? null,
    registrationChannel:
      primaryVariant?.registrationChannel ?? getRegistrationChannel(offer),
    allowPreliminaryRegistration:
      primaryVariant?.allowPreliminaryRegistration ??
      getAllowPreliminaryRegistration(offer, statusKey),
    allowWaitlistWhenSoldOut: offer.scheduleCard?.allowWaitlistWhenSoldOut ?? false,
    variants,
    media: {
      hero,
      compact,
    },
    status: {
      label: statusLabel,
      variant: getScheduleStatusVariant(offer, now),
      isArchivedState: statusKey === "finished" || statusKey === "cancelled",
      isSoldOut: statusKey === "sold_out",
      isPlanning: statusKey === "planning",
      isCancelled: statusKey === "cancelled",
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
