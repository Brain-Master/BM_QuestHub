import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveScheduleAddress,
  venueWithScheduleAddress,
} from "./schedule-location";
import type { Venue } from "@/lib/schemas";

const venue: Venue = {
  slug: "school-17-belyaevo",
  name: "Школа №17",
  type: "school",
  address: "ул. Введенского, 28",
  metro: "Беляево",
  city: "moscow",
  directions: [],
  photos: [],
  listedOnSites: true,
};

describe("resolveScheduleAddress", () => {
  it("uses addressOverride when set", () => {
    assert.equal(
      resolveScheduleAddress(venue, { addressOverride: "ул. Введенского, 27А" }),
      "ул. Введенского, 27А",
    );
  });

  it("falls back to venue address when override is missing or blank", () => {
    assert.equal(resolveScheduleAddress(venue, { addressOverride: undefined }), "ул. Введенского, 28");
    assert.equal(resolveScheduleAddress(venue, { addressOverride: "   " }), "ул. Введенского, 28");
    assert.equal(resolveScheduleAddress(venue, null), "ул. Введенского, 28");
  });
});

describe("venueWithScheduleAddress", () => {
  it("returns a shallow copy with resolved address", () => {
    const patched = venueWithScheduleAddress(venue, {
      addressOverride: "ул. Введенского, 27А",
    });
    assert.equal(patched.address, "ул. Введенского, 27А");
    assert.equal(venue.address, "ул. Введенского, 28");
  });
});
