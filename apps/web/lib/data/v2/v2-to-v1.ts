import type { EventStatusV2, EventV2 } from "@/lib/data/v2/entities";
import type { ScheduleSnapshotV2 } from "@/lib/data/v2/site-snapshot";
import { eventStatusLabel } from "@/lib/offers/schedule-dictionaries";
import type { OffersSnapshotV1 } from "@/lib/offers/snapshot-types";
import {
  scheduleCardSchema,
  type RegistrationChannel,
  type ScheduleVariant,
  type VenueOffer,
} from "@/lib/schemas";

function parseTimeRange(
  start: string,
  end: string,
): { startTime: string; endTime: string } {
  return { startTime: start, endTime: end };
}

function registrationChannelFromEvent(
  event: EventV2,
): RegistrationChannel {
  if (event.registration.channel === "mos_ru") return "mos_ru";
  return "brainmaster";
}

function variantToScheduleVariant(v: EventV2["variants"][number]): ScheduleVariant {
  const time =
    v.timeLabel ??
    (v.timeRange ? `${v.timeRange.start}–${v.timeRange.end}` : "");
  return {
    id: v.id,
    type: v.title,
    time,
    priceLabel: v.price.label,
    note: v.note ?? null,
    ageLabel: v.ageLabel ?? undefined,
    mosRuCode: v.registration?.mosRuCode ?? undefined,
    mosBookingUrl: v.registration?.externalUrl ?? undefined,
  };
}

function displayStatusFromKey(key: EventStatusV2): string {
  return eventStatusLabel(key);
}

function eventToVenueOffer(event: EventV2): VenueOffer {
  const slot = event.schedule.slots[0];
  const timeRange = slot?.timeRange;
  const { startTime, endTime } = timeRange
    ? parseTimeRange(timeRange.start, timeRange.end)
    : { startTime: "9:00", endTime: "17:00" };

  const primaryVariant = event.variants[0];
  const priceLabel = primaryVariant?.price.label ?? "";
  const mosBookingUrl =
    event.registration.externalUrl ??
    primaryVariant?.registration?.externalUrl ??
    null;

  const statusLabel = displayStatusFromKey(event.status.value);
  const scheduleCard = scheduleCardSchema.parse({
    displayTitle: event.presentation?.titleOverride,
    description: event.presentation?.descriptionOverride,
    teacherName: event.presentation?.teacherName,
    tags: event.presentation?.tags ?? [],
    timelineDate: event.presentation?.timelineLabel,
    shortDate: event.presentation?.shortDateLabel,
    locationNote: event.presentation?.locationNote,
    formatType: primaryVariant?.title,
    formatTime: primaryVariant?.timeLabel,
    formatNote: primaryVariant?.note,
    ageLabel: primaryVariant?.ageLabel,
    mosRuCode: primaryVariant?.registration?.mosRuCode,
    status: event.status.sourceRaw ?? statusLabel,
    isArchived:
      event.status.value === "finished" || event.status.value === "cancelled",
    allowWaitlistWhenSoldOut: event.registration.allowWaitlist,
    registrationChannel: registrationChannelFromEvent(event),
    allowPreliminaryRegistration: event.status.value === "planning",
    variants: event.variants.map(variantToScheduleVariant),
    media: event.presentation?.media,
  });

  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  };
  const dateRange = `${fmt(event.schedule.startDate)} — ${fmt(event.schedule.endDate)}`;
  const daySchedule = slot?.label ?? `Ежедневно: ${startTime}–${endTime}`;

  return {
    id: event.id,
    venueSlug: event.relations.venueId,
    shiftLabel:
      event.presentation?.titleOverride ??
      primaryVariant?.title ??
      event.relations.courseId,
    startDate: event.schedule.startDate,
    endDate: event.schedule.endDate,
    startTime,
    endTime,
    dateRange,
    daySchedule,
    priceLabel,
    mosBookingUrl,
    sheetStatus: event.status.sourceRaw ?? statusLabel,
    enrolled: event.capacity?.booked,
    maxCapacity: event.capacity?.total,
    scheduleCard,
  };
}

export function scheduleV2ToOffersByQuest(
  schedule: ScheduleSnapshotV2,
): OffersSnapshotV1["offersByQuest"] {
  const out: OffersSnapshotV1["offersByQuest"] = {};
  for (const event of schedule.events) {
    const courseId = event.relations.courseId;
    if (!out[courseId]) out[courseId] = [];
    out[courseId].push(eventToVenueOffer(event));
  }
  return out;
}

export function scheduleV2ToOffersSnapshotV1(
  schedule: ScheduleSnapshotV2,
): OffersSnapshotV1 {
  return {
    version: 1,
    generatedAt: schedule.generatedAt,
    source: schedule.source,
    offersByQuest: scheduleV2ToOffersByQuest(schedule),
  };
}
