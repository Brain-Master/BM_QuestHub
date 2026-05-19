import type { EventStatusV2, EventV2, EventVariantV2 } from "@/lib/data/v2/entities";
import type { ScheduleSnapshotV2 } from "@/lib/data/v2/site-snapshot";
import type { OffersSnapshotV1 } from "@/lib/offers/snapshot-types";
import type {
  RegistrationChannel,
  ScheduleVariant,
  VenueOffer,
} from "@/lib/schemas";

const DEFAULT_TIMEZONE = "Europe/Moscow";

const STATUS_MAP: Record<string, EventStatusV2> = {
  "идёт набор": "recruiting",
  "идет набор": "recruiting",
  "скоро старт": "planning",
  "можно присоединиться": "join_late",
  "мест нет": "sold_out",
  "завершено": "finished",
  "отменено": "cancelled",
};

function normalizeEventStatus(raw: string | undefined): EventStatusV2 {
  const key = (raw ?? "").trim().toLowerCase();
  return STATUS_MAP[key] ?? "recruiting";
}

function mapRegistrationChannel(
  channel: RegistrationChannel | undefined,
  mosUrl: string | null | undefined,
): EventV2["registration"] {
  if (channel === "mos_ru" || (mosUrl && mosUrl.length > 0)) {
    return {
      channel: "mos_ru",
      allowBooking: true,
      allowWaitlist: true,
      externalUrl: mosUrl && mosUrl.length > 0 ? mosUrl : undefined,
    };
  }
  return {
    channel: "brainmaster",
    allowBooking: true,
    allowWaitlist: true,
  };
}

function mapVariant(v: ScheduleVariant): EventVariantV2 {
  return {
    id: v.id,
    title: v.type,
    timeLabel: v.time,
    price: { currency: "RUB", label: v.priceLabel },
    ageLabel: v.ageLabel ?? undefined,
    note: v.note ?? undefined,
    registration: {
      channel: v.mosBookingUrl ? "mos_ru" : undefined,
      mosRuCode: v.mosRuCode ?? undefined,
      externalUrl: v.mosBookingUrl ?? undefined,
    },
    availability: { isAvailable: true },
  };
}

export function venueOfferToEventV2(
  courseSlug: string,
  offer: VenueOffer,
): EventV2 {
  const card = offer.scheduleCard;
  const rawStatus = card?.status ?? offer.sheetStatus;
  const variants = card?.variants ?? [];

  return {
    id: offer.id,
    relations: {
      courseId: courseSlug,
      venueId: offer.venueSlug,
    },
    schedule: {
      startDate: offer.startDate,
      endDate: offer.endDate,
      timezone: DEFAULT_TIMEZONE,
      slots: [
        {
          label: offer.daySchedule,
          timeRange: { start: offer.startTime, end: offer.endTime },
        },
      ],
    },
    status: {
      value: normalizeEventStatus(rawStatus),
      sourceRaw: rawStatus,
    },
    capacity:
      offer.maxCapacity !== undefined && offer.enrolled !== undefined
        ? {
            total: offer.maxCapacity,
            booked: offer.enrolled,
          }
        : undefined,
    registration: {
      ...mapRegistrationChannel(
        card?.registrationChannel,
        offer.mosBookingUrl,
      ),
      allowWaitlist: card?.allowWaitlistWhenSoldOut ?? false,
    },
    presentation: card
      ? {
          titleOverride: card.displayTitle ?? undefined,
          descriptionOverride: card.description ?? undefined,
          teacherName: card.teacherName ?? undefined,
          tags: card.tags ?? [],
          media: card.media,
          timelineLabel: card.timelineDate ?? undefined,
          shortDateLabel: card.shortDate ?? undefined,
          locationNote: card.locationNote ?? undefined,
        }
      : undefined,
    variants: variants.map(mapVariant),
  };
}

export function offersSnapshotV1ToScheduleV2(
  snapshot: OffersSnapshotV1,
): ScheduleSnapshotV2 {
  const events: EventV2[] = [];
  for (const [courseSlug, offers] of Object.entries(snapshot.offersByQuest)) {
    for (const offer of offers) {
      events.push(venueOfferToEventV2(courseSlug, offer));
    }
  }

  return {
    version: 2,
    generatedAt: snapshot.generatedAt,
    source: snapshot.source ?? "v1_offers_snapshot",
    events,
  };
}
