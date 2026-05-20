import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isSkippableDataRow,
  normalizeHeaderCell,
  parseVenueRow,
  validateHeaderRow,
  VENUE_HEADERS,
  WORLD_REQUIRED_HEADERS,
} from "./cold-sheet-contract";

describe("cold-sheet-contract", () => {
  it("validates venue headers", () => {
    const r = validateHeaderRow(
      VENUE_HEADERS.map((h) => h.toUpperCase()),
      VENUE_HEADERS,
    );
    assert.equal(r.ok, true);
  });

  it("accepts legacy world headers without hero_video_file_url columns", () => {
    const legacy = [
      "slug",
      "name",
      "description",
      "theme_key",
      "tagline",
      "pitch",
      "highlights",
      "hero_video_url",
      "hero_image_url",
      "card_gradient",
      "card_glow",
      "icon_key",
    ];
    const r = validateHeaderRow(legacy, WORLD_REQUIRED_HEADERS);
    assert.equal(r.ok, true);
  });

  it("skips course rows without slug", () => {
    const headers = ["slug", "title"];
    const cells = ["", "черновик"];
    assert.equal(isSkippableDataRow(cells, headers), true);
  });

  it("parses a minimal venue row", () => {
    const headers = VENUE_HEADERS.map(normalizeHeaderCell);
    const obj: Record<string, string> = {};
    const values = [
      "school-test",
      "Школа тест",
      "",
      "school",
      "ул. Тест, 1",
      "Тестовая",
      "moscow",
      "",
      "55.7",
      "37.6",
      "school-test",
      "true",
      "",
      "шаг 1; шаг 2",
      "",
      "",
    ];
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    const r = parseVenueRow(obj);
    assert.equal(r.success, true);
    if (r.success) {
      assert.equal(r.data.slug, "school-test");
      assert.equal(r.data.directions.length, 2);
    }
  });
});
