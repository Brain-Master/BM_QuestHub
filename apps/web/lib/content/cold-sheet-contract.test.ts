import assert from "node:assert/strict";

import { describe, it } from "node:test";



import {

  isSkippableDataRow,

  normalizeHeaderCell,

  parseCourseRow,

  parseVenueRow,

  parseWorldRow,

  validateHeaderRow,

  VENUE_REQUIRED_HEADERS,

  WORLD_REQUIRED_HEADERS,

} from "./cold-sheet-contract";



describe("cold-sheet-contract", () => {

  it("validates venue required headers without media columns", () => {

    const r = validateHeaderRow(

      VENUE_REQUIRED_HEADERS.map((h) => h.toUpperCase()),

      VENUE_REQUIRED_HEADERS,

    );

    assert.equal(r.ok, true);

    assert.equal(r.ok && r.normalized.includes("logo_url"), false);

  });



  it("accepts legacy world headers without hero_image_url", () => {

    const legacy = [

      "slug",

      "name",

      "description",

      "theme_key",

      "tagline",

      "pitch",

      "highlights",

      "hero_video_embed_url",

      "card_gradient",

      "card_glow",

      "icon_key",

    ];

    const r = validateHeaderRow(legacy, WORLD_REQUIRED_HEADERS);

    assert.equal(r.ok, true);

  });



  it("parseWorldRow rejects invalid icon_key", () => {
    const obj: Record<string, string> = {
      slug: "test-world",
      name: "Мир",
      description: "Описание мира достаточной длины",
      theme_key: "cyber",
      tagline: "Слоган",
      pitch: "Питч",
      highlights: "a; b",
      card_gradient: "from-sky-400/25",
      card_glow: "shadow-[0_0_45px]",
      icon_key: "shadow-[0_0_45px]",
    };
    const r = parseWorldRow(obj);
    assert.equal(r.success, false);
  });

  it("parseWorldRow ignores unknown hero_image_url column", () => {

    const obj: Record<string, string> = {

      slug: "test-world",

      name: "Мир",

      description: "Описание мира достаточной длины",

      theme_key: "cyber",

      tagline: "Слоган",

      pitch: "Питч",

      highlights: "a; b",

      hero_image_url: "https://example.com/should-not-parse.jpg",

    };

    const r = parseWorldRow(obj);

    assert.equal(r.success, true);

    if (r.success) {

      assert.equal(r.data.heroImageUrl, undefined);

    }

  });



  it("parseCourseRow ignores hero_image_url from sheet", () => {

    const obj: Record<string, string> = {

      slug: "test-quest",

      world_slug: "test-world",

      title: "Квест",

      tagline: "Тег",

      age_label: "10+",

      format: "intensive",

      skills: "логика",

      story: "история",

      skills_parent: "родителям",

      loot: "лут",

      approach: "подход",

      hero_image_url: "https://example.com/x.jpg",

    };

    const r = parseCourseRow(obj);

    assert.equal(r.success, true);

    if (r.success) {

      assert.equal(r.data.heroImageUrl, undefined);

    }

  });



  it("skips course rows without slug", () => {

    const headers = ["slug", "title"];

    const cells = ["", "черновик"];

    assert.equal(isSkippableDataRow(cells, headers), true);

  });



  it("parses a minimal venue row without logo_url", () => {

    const headers = VENUE_REQUIRED_HEADERS.map(normalizeHeaderCell);

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

      assert.equal(r.data.logoUrl, undefined);

      assert.equal(r.data.directions.length, 2);

    }

  });

});


