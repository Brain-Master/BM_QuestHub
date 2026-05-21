import { expect, test } from "@playwright/test";

import { placeVariantsInFooter } from "../components/schedule-board-card-compact";
import {
  buildScheduleBoardItem,
  formatScheduleDateRange,
  getScheduleBookingMode,
  getScheduleCapacity,
  getScheduleDisplayStatus,
} from "../lib/offers/schedule-board";
import { resolveRegistrationFlow } from "../lib/registration-flow";
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

  test("planning status uses a clearer preliminary CTA", () => {
    const item = offer({ sheetStatus: "Согласование" });
    const status = getScheduleDisplayStatus(item, now);

    expect(status).toBe("Скоро старт");
    expect(getScheduleBookingMode(item, status)).toEqual({
      kind: "waitlist",
      label: "Предварительная заявка",
    });
  });

  test("mos offers collect an assist lead before external registration", () => {
    const flow = resolveRegistrationFlow({
      bookingMode: {
        kind: "mos",
        label: "Записаться (Mos.ru)",
        url: "https://www.mos.ru/",
      },
      registrationChannel: "mos_ru",
    });

    expect(flow).toMatchObject({
      kind: "mos_assist",
      leadType: "mos_assist",
      title: "Запись через mos.ru",
      submitLabel: "Перейти к записи на mos.ru",
    });
    expect(flow.noticeText).toContain("mos.ru");
    expect(flow.fallbackTitle).toBe("Продолжите запись на mos.ru");
    expect(flow.fallbackText).toContain("mos.ru");
    expect(flow.fallbackText).toContain("+7 (977) 967-88-00");
  });

  test("waitlist flow explains that preliminary registration is not a booking", () => {
    const flow = resolveRegistrationFlow({
      bookingMode: { kind: "waitlist", label: "Предварительная заявка" },
      registrationChannel: "mos_ru",
    });

    expect(flow).toMatchObject({
      kind: "waitlist",
      leadType: "waitlist",
      title: "Предварительная заявка",
      successTitle: "Заявка принята",
    });
    expect(flow.noticeText).toContain("старте набора");
    expect(flow.noticeText).toContain("портал mos.ru");
    expect(flow.successText).toContain("не бронь места");
  });

  test("sold-out waitlist success copy mentions a freed spot", () => {
    const flow = resolveRegistrationFlow({
      bookingMode: { kind: "waitlist", label: "В лист ожидания" },
      registrationChannel: "brainmaster",
    });

    expect(flow).toMatchObject({
      kind: "waitlist",
      title: "Заявка в лист ожидания",
      successTitle: "Вы в листе ожидания",
    });
    expect(flow.noticeText).toContain("не бронь места");
    expect(flow.successText).toContain("освободится место");
  });

  test("date range is displayed as a human Russian range", () => {
    expect(formatScheduleDateRange("2026-05-01", "2026-05-05")).toBe(
      "1–5 мая",
    );
    expect(formatScheduleDateRange("2026-06-30", "2026-07-04")).toBe(
      "30 июня – 4 июля",
    );
  });

  test("schedule card variants are normalized into one board item", () => {
    const item = offer({
      scheduleCard: {
        isArchived: false,
        tags: [],
        variants: [
          {
            id: "half",
            type: "Интенсив (полдня)",
            time: "Пн-Пт, 9:00 – 12:30",
            priceLabel: "8 500 ₽",
            note: "Перекус включён",
            ageLabel: "6–13 лет",
          },
          {
            id: "full",
            type: "Полный день",
            time: "Пн-Пт, 8:00 – 18:00",
            priceLabel: "14 000 ₽",
            note: "Питание включено",
            ageLabel: "6–13 лет",
          },
        ],
      },
    });

    const boardItem = buildScheduleBoardItem({
      offer: item,
      quest: {
        slug: "test",
        title: "Тестовая программа",
        worldSlug: "test-world",
        ageLabel: "6–13 лет",
        tagline: "Тест",
      },
      venue: {
        slug: "test-venue",
        name: "Тестовая площадка",
        type: "school",
        address: "Тестовый адрес",
      },
      world: null,
    });

    expect(boardItem.variants).toHaveLength(2);
    expect(boardItem.commonAgeLabel).toBe("6–13 лет");
    expect(placeVariantsInFooter(boardItem.variants.length)).toBe(false);
  });

  test("three schedule card variants use compact footer placement", () => {
    const item = offer({
      scheduleCard: {
        isArchived: false,
        tags: [],
        variants: [
          {
            id: "half",
            type: "Интенсив (полдня)",
            time: "Пн-Пт, 9:00 – 12:30",
            priceLabel: "8 500 ₽",
            ageLabel: "6–13 лет",
          },
          {
            id: "full",
            type: "Полный день",
            time: "Пн-Пт, 8:00 – 18:00",
            priceLabel: "14 000 ₽",
            ageLabel: "6–13 лет",
          },
          {
            id: "short",
            type: "Короткий формат",
            time: "Пн-Пт, 11:30 – 15:30",
            priceLabel: "1 600 ₽",
            ageLabel: "6–13 лет",
          },
        ],
      },
    });

    const boardItem = buildScheduleBoardItem({
      offer: item,
      quest: {
        slug: "test",
        title: "Тестовая программа",
        worldSlug: "test-world",
        ageLabel: "6–13 лет",
        tagline: "Тест",
      },
      venue: {
        slug: "test-venue",
        name: "Тестовая площадка",
        type: "school",
        address: "Тестовый адрес",
      },
      world: null,
    });

    expect(boardItem.variants).toHaveLength(3);
    expect(placeVariantsInFooter(boardItem.variants.length)).toBe(true);
  });

  test("waitlist lead payload keeps an explicit lead type", () => {
    const parsed = leadSchema.parse({
      leadType: "waitlist",
      parentName: "Иван Тестов",
      contact: "+7 (999) 000-00-00",
      childName: "Петя Иванов",
      childAge: "8",
      comment: "Нет аллергий",
      consent: true,
      questSlug: "minecraft",
      questTitle: "Minecraft",
      offerId: "test-offer",
      variantId: "half",
      variantTitle: "Интенсив (полдня)",
      venueSlug: "test-venue",
      venueName: "Тестовая площадка",
    });

    expect(parsed.leadType).toBe("waitlist");
  });

  test("mos assist lead payload keeps registration channel", () => {
    const parsed = leadSchema.parse({
      leadType: "mos_assist",
      registrationChannel: "mos_ru",
      parentName: "Иван Тестов",
      contact: "+7 (999) 000-00-00",
      childName: "Петя Иванов",
      childAge: "8",
      consent: true,
      questSlug: "minecraft",
      questTitle: "Minecraft",
      offerId: "test-offer",
      venueSlug: "test-venue",
      venueName: "Тестовая площадка",
    });

    expect(parsed.leadType).toBe("mos_assist");
    expect(parsed.registrationChannel).toBe("mos_ru");
  });

  test("lead schema normalizes a masked Russian phone", () => {
    const parsed = leadSchema.parse({
      leadType: "booking",
      parentName: "Иван Иванов",
      contact: "+7 (999) 000-00-00",
      childName: "Петя Иванов",
      childAge: "9",
      consent: true,
      questSlug: "minecraft",
      questTitle: "Minecraft",
      offerId: "test-offer",
      venueSlug: "test-venue",
      venueName: "Тестовая площадка",
    });

    expect(parsed.contact).toBe("+79990000000");
    expect(parsed.childAge).toBe("9");
    expect(parsed.parentName).toBe("Иван Иванов");
  });

  test("lead schema rejects incomplete phone numbers", () => {
    const result = leadSchema.safeParse({
      leadType: "booking",
      parentName: "Иван Иванов",
      contact: "+7 (999) 000",
      childName: "Петя Иванов",
      childAge: "9",
      consent: true,
      questSlug: "minecraft",
      questTitle: "Minecraft",
      offerId: "test-offer",
      venueSlug: "test-venue",
      venueName: "Тестовая площадка",
    });

    expect(result.success).toBe(false);
  });

  test("lead schema rejects invalid child ages", () => {
    const base = {
      leadType: "booking" as const,
      parentName: "Иван Иванов",
      contact: "+7 (999) 000-00-00",
      childName: "Петя Иванов",
      consent: true,
      questSlug: "minecraft",
      questTitle: "Minecraft",
      offerId: "test-offer",
      venueSlug: "test-venue",
      venueName: "Тестовая площадка",
    };

    for (const childAge of ["два", "0", "19", ""]) {
      expect(leadSchema.safeParse({ ...base, childAge }).success).toBe(false);
    }
  });

  test("lead schema rejects invalid person names", () => {
    const base = {
      leadType: "booking" as const,
      contact: "+7 (999) 000-00-00",
      childName: "Петя Иванов",
      childAge: "9",
      consent: true,
      questSlug: "minecraft",
      questTitle: "Minecraft",
      offerId: "test-offer",
      venueSlug: "test-venue",
      venueName: "Тестовая площадка",
    };

    expect(leadSchema.safeParse({ ...base, parentName: "А" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...base, parentName: "12345" }).success).toBe(
      false,
    );
  });
});
