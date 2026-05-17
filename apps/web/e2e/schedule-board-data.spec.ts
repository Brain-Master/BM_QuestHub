import { expect, test } from "@playwright/test";

import {
  getScheduleBookingMode,
  getScheduleCapacity,
  getScheduleDisplayStatus,
} from "../lib/offers/schedule-board";
import { leadSchema, type VenueOffer } from "../lib/schemas";

function offer(overrides: Partial<VenueOffer> = {}): VenueOffer {
  return {
    id: "test-offer",
    venueSlug: "test-venue",
    shiftLabel: "Тестовая смена",
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    startTime: "9:00",
    endTime: "12:30",
    dateRange: "01.06.2026 — 05.06.2026",
    daySchedule: "Ежедневно: 9:00–12:30",
    priceLabel: "8 500 ₽",
    sheetStatus: "Идёт набор",
    enrolled: 0,
    maxCapacity: 20,
    ...overrides,
  };
}

test.describe("Schedule Board data rules", () => {
  const now = new Date("2026-05-20T12:00:00");

  test("sold-out can become waitlist when data allows it", () => {
    const item = offer({
      enrolled: 20,
      maxCapacity: 20,
      scheduleCard: {
        allowWaitlistWhenSoldOut: true,
        isArchived: false,
        tags: [],
      },
    });

    const status = getScheduleDisplayStatus(item, now);
    expect(status).toBe("Мест нет");
    expect(getScheduleBookingMode(item, status)).toEqual({
      kind: "waitlist",
      label: "В лист ожидания",
    });
  });

  test("sold-out is disabled when waitlist is not allowed", () => {
    const item = offer({ enrolled: 20, maxCapacity: 20 });
    const status = getScheduleDisplayStatus(item, now);

    expect(getScheduleBookingMode(item, status)).toEqual({
      kind: "disabled",
      label: "Мест нет",
    });
  });

  test("capacity clamps overbooking to one hundred percent", () => {
    expect(getScheduleCapacity(offer({ enrolled: 26, maxCapacity: 20 }))).toMatchObject({
      booked: 20,
      left: 0,
      percent: 100,
      isSoldOut: true,
    });
  });

  test("completed events cannot be sold-out CTAs", () => {
    const item = offer({
      endDate: "2026-05-10",
      enrolled: 20,
      maxCapacity: 20,
      scheduleCard: {
        allowWaitlistWhenSoldOut: true,
        isArchived: false,
        tags: [],
      },
    });

    const status = getScheduleDisplayStatus(item, now);
    expect(status).toBe("Завершено");
    expect(getScheduleBookingMode(item, status)).toEqual({
      kind: "disabled",
      label: "Завершено",
    });
  });

  test("waitlist lead payload keeps an explicit lead type", () => {
    const parsed = leadSchema.parse({
      leadType: "waitlist",
      parentName: "Тест",
      contact: "+7 999 000-00-00",
      consent: true,
      questSlug: "minecraft",
      questTitle: "Minecraft",
      offerId: "test-offer",
      venueSlug: "test-venue",
      venueName: "Тестовая площадка",
    });

    expect(parsed.leadType).toBe("waitlist");
  });
});
