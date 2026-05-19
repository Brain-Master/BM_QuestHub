import { expect, test } from "@playwright/test";

import siteConfig from "../data/v2/site-config.json";
import { eventStatusLabel } from "../lib/offers/schedule-dictionaries";

test.describe("Hardcoded data guardrails", () => {
  test("schedule status labels come from site-config dictionaries", () => {
    expect(eventStatusLabel("recruiting")).toBe(
      siteConfig.dictionaries.eventStatus.recruiting.label,
    );
    expect(eventStatusLabel("planning")).toBe(
      siteConfig.dictionaries.eventStatus.planning.label,
    );
  });

  test("map calibration reads site points from config", () => {
    expect(siteConfig.map.sitePoints["school-1212"]).toEqual({ x: 46, y: 83 });
    expect(siteConfig.map.geoControlPoints.length).toBeGreaterThan(0);
  });
});
