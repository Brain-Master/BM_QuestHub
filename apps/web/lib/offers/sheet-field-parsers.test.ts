import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShiftGroupId,
  isZeroPrice,
  parseSheetBool,
  parseSheetDate,
  parseSheetNonNegativeInt,
  parseSheetPrice,
  parseSheetTime,
  parseSheetUrl,
} from "./sheet-field-parsers";

describe("parseSheetPrice", () => {
  const cases: Array<[unknown, number | undefined]> = [
    [8500, 8500],
    ["8500", 8500],
    ["'8500", 8500],
    ["8 500", 8500],
    ["8\u00a0500", 8500],
    ["8 500 ₽", 8500],
    ["14'000", 14000],
    ["14'000,00", 14000],
    ["14.000,00", 14000],
    ["14 000,00", 14000],
    ["14000.00", 14000],
    ["", undefined],
    ["abc", undefined],
    [0, 0],
    ["0", 0],
  ];

  for (const [input, expected] of cases) {
    it(`parses ${JSON.stringify(input)} → ${expected}`, () => {
      assert.equal(parseSheetPrice(input), expected);
    });
  }
});

describe("parseSheetDate", () => {
  it("accepts ISO", () => {
    assert.equal(parseSheetDate("2026-06-01"), "2026-06-01");
  });

  it("accepts RU dotted", () => {
    assert.equal(parseSheetDate("01.06.2026"), "2026-06-01");
  });
});

describe("parseSheetTime", () => {
  it("pads hour", () => {
    assert.equal(parseSheetTime("9:00"), "9:00");
    assert.equal(parseSheetTime("09:00"), "9:00");
  });

  it("accepts dot separator", () => {
    assert.equal(parseSheetTime("9.30"), "9:30");
  });
});

describe("parseSheetBool", () => {
  it("parses Russian yes/no", () => {
    assert.equal(parseSheetBool("да"), true);
    assert.equal(parseSheetBool("нет"), false);
  });
});

describe("buildShiftGroupId", () => {
  it("uses explicit id when set", () => {
    assert.equal(
      buildShiftGroupId({
        shift_group_id: "custom-group",
        quest_slug: "q",
        venue_slug: "v",
        start_date: "2026-06-01",
        end_date: "2026-06-05",
      }),
      "custom-group",
    );
  });

  it("auto-generates from quest venue dates", () => {
    assert.equal(
      buildShiftGroupId({
        quest_slug: "minecraft",
        venue_slug: "school-1",
        start_date: "2026-06-01",
        end_date: "2026-06-05",
      }),
      "minecraft:school-1:2026-06-01:2026-06-05",
    );
  });
});

describe("isZeroPrice", () => {
  it("detects zero variants", () => {
    assert.equal(isZeroPrice("0"), true);
    assert.equal(isZeroPrice("'0"), true);
    assert.equal(isZeroPrice("8500"), false);
  });
});

describe("parseSheetUrl", () => {
  it("trims and validates https", () => {
    assert.equal(
      parseSheetUrl("  https://www.mos.ru/x  "),
      "https://www.mos.ru/x",
    );
  });
});

describe("parseSheetNonNegativeInt", () => {
  it("parses enrolled with apostrophe thousands", () => {
    assert.equal(parseSheetNonNegativeInt("1'234"), 1234);
  });
});
