import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveVenueShortName } from "./venue-label";

describe("resolveVenueShortName", () => {
  it("returns displayName when set", () => {
    assert.equal(
      resolveVenueShortName({
        name: "ГБОУДО «Московский детско-юношеский центр экологии, краеведения и туризма»",
        displayName: "МДЮЦ ЭКТ",
      }),
      "МДЮЦ ЭКТ",
    );
  });

  it("falls back to legal name", () => {
    assert.equal(
      resolveVenueShortName({
        name: "Школа №17",
      }),
      "Школа №17",
    );
  });

  it("ignores blank displayName", () => {
    assert.equal(
      resolveVenueShortName({
        name: "Школа №17",
        displayName: "   ",
      }),
      "Школа №17",
    );
  });
});
