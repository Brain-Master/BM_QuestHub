import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mergeGroupAndFormat } from "./sheet-hot-join";
import { sheetRowSchema } from "./sheet-contract";

describe("sheet-hot-join", () => {
  it("mergeGroupAndFormat produces valid sheet row", () => {
    const merged = mergeGroupAndFormat(
      {
        shift_group_id: "q:v:2026-07-01:2026-07-05",
        program_name_h1: "Мехвариум",
        program_name_h2: "Лаборатория Кинетических Монстров",
        quest_slug: "quest-a",
        venue_slug: "venue-b",
        start_date: "2026-07-01",
        end_date: "2026-07-05",
        school_name: "",
        address: "ул. Пример, 1",
        status: "open",
      },
      {
        shift_group_id: "q:v:2026-07-01:2026-07-05",
        start_time: "9:00",
        end_time: "16:30",
        price: "8500",
        format_type: "Полный день",
        registration_channel: "mos_ru",
      },
    );
    const parsed = sheetRowSchema.safeParse(merged);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.price, 8500);
      assert.equal(parsed.data.program_name_h2, "Лаборатория Кинетических Монстров");
      assert.equal(parsed.data.registration_channel, "mos_ru");
    }
  });
});
