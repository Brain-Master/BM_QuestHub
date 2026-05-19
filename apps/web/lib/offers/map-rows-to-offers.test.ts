import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  consolidateOffersByShiftGroup,
  mapSheetRowToVenueOffer,
} from "./map-rows-to-offers";
import type { SheetRow } from "./sheet-contract";

const venueSlugs = new Set(["school-2103-yasenevo"]);

function baseRow(overrides: Partial<SheetRow> = {}): SheetRow {
  return {
    program_name_h1: "Мехвариум",
    program_name_h2: "Лаборатория Кинетических Монстров",
    quest_slug: "mekhvarium-laboratoriya-kineticheskih-monstrov",
    venue_slug: "school-2103-yasenevo",
    start_date: "2026-05-25",
    end_date: "2026-05-29",
    start_time: "9:00",
    end_time: "12:30",
    price: 8500,
    school_name: "Школа №2103",
    address: "ул. Тест",
    status: "Идёт набор",
    format_type: "Интенсив (полдня)",
    ...overrides,
  };
}

describe("consolidateOffersByShiftGroup", () => {
  it("merges two sheet rows with the same shift id into one offer with two variants", () => {
    const half = mapSheetRowToVenueOffer(
      baseRow({ format_type: "Интенсив (полдня)", price: 8500 }),
      venueSlugs,
    );
    const full = mapSheetRowToVenueOffer(
      baseRow({
        format_type: "Полный день",
        end_time: "18:00",
        price: 14000,
      }),
      venueSlugs,
    );
    assert.ok("ok" in half && "ok" in full);

    const merged = consolidateOffersByShiftGroup([half.ok, full.ok]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].scheduleCard?.variants?.length, 2);
    assert.notEqual(
      merged[0].scheduleCard?.variants?.[0]?.id,
      merged[0].scheduleCard?.variants?.[1]?.id,
    );
  });

  it("merges rows with different format times when shift_group_id matches", () => {
    const half = mapSheetRowToVenueOffer(
      baseRow({ format_type: "Интенсив (полдня)", start_time: "9:00", end_time: "12:30" }),
      venueSlugs,
    );
    const full = mapSheetRowToVenueOffer(
      baseRow({
        format_type: "Полный день",
        start_time: "8:00",
        end_time: "18:00",
        price: 14000,
      }),
      venueSlugs,
    );
    assert.ok("ok" in half && "ok" in full);
    assert.equal(half.ok._shiftGroupId, full.ok._shiftGroupId);

    const merged = consolidateOffersByShiftGroup([half.ok, full.ok]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].scheduleCard?.variants?.length, 2);
    assert.equal(merged[0].startTime, "8:00");
    assert.equal(merged[0].endTime, "18:00");
  });

  it("merges three sheet rows with the same shift id into one offer with three variants", () => {
    const half = mapSheetRowToVenueOffer(
      baseRow({ format_type: "Интенсив (полдня)", price: 8500 }),
      venueSlugs,
    );
    const full = mapSheetRowToVenueOffer(
      baseRow({
        format_type: "Полный день",
        end_time: "18:00",
        price: 14000,
      }),
      venueSlugs,
    );
    const short = mapSheetRowToVenueOffer(
      baseRow({
        format_type: "Короткий формат",
        start_time: "11:30",
        end_time: "15:30",
        price: 1600,
      }),
      venueSlugs,
    );
    assert.ok("ok" in half && "ok" in full && "ok" in short);

    const merged = consolidateOffersByShiftGroup([half.ok, full.ok, short.ok]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].scheduleCard?.variants?.length, 3);
    assert.deepEqual(
      merged[0].scheduleCard?.variants?.map((variant) => variant.type),
      ["Интенсив (полдня)", "Полный день", "Короткий формат"],
    );
  });

  it("keeps distinct shifts separate", () => {
    const a = mapSheetRowToVenueOffer(baseRow(), venueSlugs);
    const b = mapSheetRowToVenueOffer(
      baseRow({ start_date: "2026-06-01", end_date: "2026-06-05" }),
      venueSlugs,
    );
    assert.ok("ok" in a && "ok" in b);

    const merged = consolidateOffersByShiftGroup([a.ok, b.ok]);
    assert.equal(merged.length, 2);
  });
});
