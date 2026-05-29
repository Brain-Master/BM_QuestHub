import { expect, test } from "@playwright/test";

import {
  buildCityCards,
  isCityActive,
  type CityCard,
} from "../lib/sites/city-card";
import type { SiteScopeCard } from "../lib/sites/scope-card";

function site(overrides: Partial<SiteScopeCard> & Pick<SiteScopeCard, "city">): SiteScopeCard {
  return {
    slug: "school-test",
    name: "Test School",
    fullName: "Test School",
    routeSlugs: ["school-test"],
    type: "school",
    city: overrides.city,
    cityLabel: overrides.city,
    locationLabel: "District",
    locationSummary: "District",
    campusCount: 1,
    campuses: [],
    courseCount: overrides.courseCount ?? 1,
    courseSlugs: overrides.courseSlugs ?? ["quest-a"],
    shiftCount: overrides.shiftCount ?? 2,
    studentCount: overrides.studentCount ?? 5,
    activityScore: 3,
    listedOnSites: true,
    hasMapCoordinates: false,
    ...overrides,
  };
}

test.describe("City cards aggregation", () => {
  test("hides cities without courses or groups", () => {
    const cards = buildCityCards([
      site({
        city: "ufa",
        courseCount: 0,
        courseSlugs: [],
        shiftCount: 0,
        studentCount: 0,
      }),
    ]);

    expect(cards).toHaveLength(0);
  });

  test("aggregates unique courses and enrolled participants per city", () => {
    const cards = buildCityCards([
      site({
        city: "krasnodar",
        slug: "school-a",
        courseSlugs: ["quest-a", "quest-b"],
        shiftCount: 3,
        studentCount: 10,
      }),
      site({
        city: "krasnodar",
        slug: "school-b",
        courseSlugs: ["quest-b", "quest-c"],
        shiftCount: 2,
        studentCount: 4,
      }),
    ]);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      slug: "krasnodar",
      label: "Краснодар",
      siteCount: 2,
      courseCount: 3,
      groupCount: 5,
      participantCount: 14,
    });
    expect(isCityActive(cards[0] as CityCard)).toBe(true);
  });

  test("keeps multiple active cities sorted by metadata order", () => {
    const cards = buildCityCards([
      site({ city: "ufa", slug: "school-ufa" }),
      site({ city: "moscow", slug: "school-moscow" }),
      site({ city: "krasnodar", slug: "school-krasnodar" }),
    ]);

    expect(cards.map((card) => card.slug)).toEqual(["moscow", "krasnodar", "ufa"]);
  });
});
