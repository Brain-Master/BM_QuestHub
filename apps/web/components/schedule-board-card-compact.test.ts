import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { placeVariantsInFooter } from "./schedule-board-card-compact";
import { buildScheduleBoardItem } from "../lib/offers/schedule-board";
import { venueOfferSchema, venueSchema, type VenueOffer } from "../lib/schemas";

function offerWithVariants(count: number): VenueOffer {
  const variants = Array.from({ length: count }, (_, index) => ({
    id: `variant-${index + 1}`,
    type: `Формат ${index + 1}`,
    time: "Пн-Пт, 9:00 – 12:30",
    priceLabel: `${(index + 1) * 1000} ₽`,
    note: null,
    ageLabel: "6–13 лет",
  }));

  return venueOfferSchema.parse({
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
    scheduleCard: {
      isArchived: false,
      tags: [],
      variants,
    },
  });
}

describe("placeVariantsInFooter", () => {
  it("keeps two or fewer formats in the inline column", () => {
    assert.equal(placeVariantsInFooter(1), false);
    assert.equal(placeVariantsInFooter(2), false);
  });

  it("moves three or more formats to the card footer", () => {
    assert.equal(placeVariantsInFooter(3), true);
    assert.equal(placeVariantsInFooter(4), true);
  });
});

describe("buildScheduleBoardItem with multiple variants", () => {
  it("normalizes three schedule card variants on one board item", () => {
    const boardItem = buildScheduleBoardItem({
      offer: offerWithVariants(3),
      quest: {
        format: "intensive",
        slug: "test",
        title: "Тестовая программа",
        worldSlug: "test-world",
        ageLabel: "6–13 лет",
        tagline: "Тест",
      },
      venue: venueSchema.parse({
        slug: "test-venue",
        name: "Тестовая площадка",
        type: "school",
        address: "Тестовый адрес",
      }),
      world: null,
    });

    assert.equal(boardItem.variants.length, 3);
    assert.equal(placeVariantsInFooter(boardItem.variants.length), true);
  });
});
