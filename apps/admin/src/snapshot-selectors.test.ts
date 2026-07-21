import { describe, expect, it } from "vitest";

import { createValidSnapshotBundleFixture } from "./test-fixtures/snapshot-bundle.fixtures";
import type { SnapshotsBundle } from "./snapshot-boundary";
import {
  selectCollectionStatuses,
  selectCourseSummaries,
  selectEntityCounts,
  selectOfferSummaries,
  selectSnapshotReadModel,
  selectStatusCounts,
  selectVenueSummaries,
  selectWorldSummaries,
  type OfferSummary,
  type SnapshotReadModel,
} from "./snapshot-selectors";

function createSelectorBundle(
  overrides: Partial<{
    catalog: Record<string, unknown>;
    map: Record<string, unknown>;
    site: Record<string, unknown>;
    manifest: Record<string, unknown> | null;
    offers: Record<string, unknown> | null;
  }> = {},
): SnapshotsBundle {
  const base = createValidSnapshotBundleFixture();
  return {
    ...base,
    catalog: overrides.catalog ?? {
      worlds: [
        { slug: "world-alpha", name: "Synthetic World Alpha" },
        { slug: "world-beta", name: "Synthetic World Beta" },
      ],
      courses: [
        {
          slug: "course-alpha",
          worldSlug: "world-alpha",
          title: "Synthetic Course Alpha",
          activeInCampaign: true,
        },
        {
          slug: "course-beta",
          worldSlug: "world-alpha",
          title: "Synthetic Course Beta",
          activeInCampaign: false,
        },
        {
          slug: "course-gamma",
          worldSlug: "world-beta",
          title: "Synthetic Course Gamma",
        },
      ],
    },
    map: overrides.map ?? {
      venues: [
        {
          slug: "venue-alpha",
          name: "Synthetic Venue Alpha",
          displayName: "Synthetic Display Venue Alpha",
          type: "school",
          address: "Synthetic Address Alpha",
          city: "Synthetic City",
          listedOnSites: true,
        },
        {
          slug: "venue-beta",
          name: "Synthetic Venue Beta",
          type: "bm_base",
          listedOnSites: false,
        },
      ],
    },
    site: overrides.site ?? { fixtureKind: "synthetic-site" },
    manifest:
      overrides.manifest === undefined
        ? { fixtureKind: "synthetic-manifest" }
        : overrides.manifest,
    offers:
      overrides.offers === undefined
        ? {
            version: 1,
            generatedAt: "synthetic-generated-at",
            offersByQuest: {
              "course-alpha": [
                {
                  id: "offer-alpha",
                  venueSlug: "venue-alpha",
                  startDate: "2026-01-01",
                  endDate: "2026-01-05",
                  enrolled: 4,
                  maxCapacity: 10,
                  sheetStatus: "closed",
                  scheduleCard: { status: "open" },
                },
                {
                  id: "offer-beta",
                  venueSlug: "venue-beta",
                  startDate: "2026-02-01",
                  endDate: "2026-02-05",
                  enrolled: 7,
                  maxCapacity: 5,
                  sheetStatus: "closed",
                },
              ],
              "course-beta": [
                {
                  id: "offer-gamma",
                  venueSlug: "venue-alpha",
                  startDate: "2026-03-01",
                  endDate: "2026-03-05",
                  scheduleCard: { isArchived: true, status: "closed" },
                },
              ],
            },
          }
        : overrides.offers,
  };
}

function serializeBundle(bundle: SnapshotsBundle): string {
  return JSON.stringify(bundle);
}

function assertNoRawEntityShape(offer: OfferSummary): void {
  expect(Object.prototype.hasOwnProperty.call(offer, "raw")).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(offer, "source")).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(offer, "entity")).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(offer, "payload")).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(offer, "snapshot")).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(offer, "details")).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(offer, "media")).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(offer, "description")).toBe(
    false,
  );
  expect(Object.prototype.hasOwnProperty.call(offer, "story")).toBe(false);
}

describe("snapshot read model selectors", () => {
  it("returns zero readable entity counts for the minimal fixture", () => {
    const bundle = createValidSnapshotBundleFixture();
    expect(selectEntityCounts(bundle)).toEqual({
      worlds: 0,
      courses: 0,
      venues: 0,
      offers: 0,
    });
  });

  it("counts readable worlds courses venues and offers", () => {
    const bundle = createSelectorBundle();
    expect(selectEntityCounts(bundle)).toEqual({
      worlds: 2,
      courses: 3,
      venues: 2,
      offers: 3,
    });
  });

  it("builds world summaries with course counts", () => {
    const worlds = selectWorldSummaries(createSelectorBundle());
    expect(worlds).toEqual([
      { id: "world-alpha", title: "Synthetic World Alpha", courseCount: 2 },
      { id: "world-beta", title: "Synthetic World Beta", courseCount: 1 },
    ]);
  });

  it("builds course summaries with status and offer counts", () => {
    const courses = selectCourseSummaries(createSelectorBundle());
    expect(courses).toEqual([
      {
        id: "course-alpha",
        title: "Synthetic Course Alpha",
        worldId: "world-alpha",
        status: "active",
        offerCount: 2,
      },
      {
        id: "course-beta",
        title: "Synthetic Course Beta",
        worldId: "world-alpha",
        status: "inactive",
        offerCount: 1,
      },
      {
        id: "course-gamma",
        title: "Synthetic Course Gamma",
        worldId: "world-beta",
        status: "unknown",
        offerCount: 0,
      },
    ]);
  });

  it("builds venue summaries with display title and status", () => {
    const venues = selectVenueSummaries(createSelectorBundle());
    expect(venues).toEqual([
      {
        id: "venue-alpha",
        title: "Synthetic Display Venue Alpha",
        type: "school",
        address: "Synthetic Address Alpha",
        city: "Synthetic City",
        status: "listed",
        offerCount: 2,
      },
      {
        id: "venue-beta",
        title: "Synthetic Venue Beta",
        type: "bm_base",
        address: null,
        city: null,
        status: "hidden",
        offerCount: 1,
      },
    ]);
  });

  it("builds bounded offer summaries in source order", () => {
    const offers = selectOfferSummaries(createSelectorBundle());
    expect(offers.map((offer) => offer.id)).toEqual([
      "offer-alpha",
      "offer-beta",
      "offer-gamma",
    ]);
    expect(offers[0]).toMatchObject({
      id: "offer-alpha",
      courseId: "course-alpha",
      venueId: "venue-alpha",
      startDate: "2026-01-01",
      endDate: "2026-01-05",
    });
    for (const offer of offers) assertNoRawEntityShape(offer);
  });

  it("derives nonnegative offer availability", () => {
    const offers = selectOfferSummaries(createSelectorBundle());
    expect(offers[0]).toMatchObject({
      capacity: 10,
      enrolled: 4,
      available: 6,
    });
    expect(offers[1]).toMatchObject({
      capacity: 5,
      enrolled: 7,
      available: 0,
    });
  });

  it("gives archived offers precedence over capacity status", () => {
    const ranked = createSelectorBundle({
      offers: {
        offersByQuest: {
          "course-alpha": [
            {
              id: "offer-alpha",
              venueSlug: "venue-alpha",
              enrolled: 10,
              maxCapacity: 10,
              scheduleCard: { isArchived: true },
            },
            {
              id: "offer-beta",
              venueSlug: "venue-alpha",
              enrolled: 10,
              maxCapacity: 10,
            },
            {
              id: "offer-gamma",
              venueSlug: "venue-alpha",
              enrolled: 2,
              maxCapacity: 10,
            },
          ],
        },
      },
    });
    expect(
      selectOfferSummaries(ranked).map((offer) => offer.availability),
    ).toEqual(["archived", "full", "available"]);

    const unknownOnly = createSelectorBundle({
      offers: {
        offersByQuest: {
          "course-alpha": [
            {
              id: "offer-alpha",
              venueSlug: "venue-alpha",
            },
          ],
        },
      },
    });
    expect(selectOfferSummaries(unknownOnly)[0]?.availability).toBe("unknown");
  });

  it("selects a bounded source status without treating it as availability", () => {
    const overlong = "x".repeat(65);
    const bundle = createSelectorBundle({
      offers: {
        offersByQuest: {
          "course-alpha": [
            {
              id: "offer-alpha",
              venueSlug: "venue-alpha",
              maxCapacity: 10,
              enrolled: 1,
              sheetStatus: "closed",
              scheduleCard: { status: "open" },
            },
            {
              id: "offer-beta",
              venueSlug: "venue-alpha",
              maxCapacity: 10,
              enrolled: 1,
              sheetStatus: "closed",
            },
            {
              id: "offer-gamma",
              venueSlug: "venue-alpha",
              maxCapacity: 10,
              enrolled: 1,
              sheetStatus: overlong,
            },
          ],
        },
      },
    });
    const offers = selectOfferSummaries(bundle);
    expect(offers.map((offer) => offer.sourceStatus)).toEqual([
      "open",
      "closed",
      null,
    ]);
    expect(offers.every((offer) => offer.availability === "available")).toBe(
      true,
    );
  });

  it("reports ready empty unavailable and malformed collection states", () => {
    const ready = selectCollectionStatuses(createSelectorBundle());
    expect(ready).toEqual({
      catalog: "ready",
      map: "ready",
      site: "ready",
      manifest: "ready",
      offers: "ready",
    });

    const empty = selectCollectionStatuses(
      createSelectorBundle({
        catalog: { worlds: [], courses: [] },
        map: { venues: [] },
        site: {},
        manifest: {},
        offers: { offersByQuest: {} },
      }),
    );
    expect(empty).toEqual({
      catalog: "empty",
      map: "empty",
      site: "empty",
      manifest: "empty",
      offers: "empty",
    });

    const unavailable = selectCollectionStatuses(
      createSelectorBundle({
        manifest: null,
        offers: null,
      }),
    );
    expect(unavailable.manifest).toBe("unavailable");
    expect(unavailable.offers).toBe("unavailable");

    const malformed = selectCollectionStatuses(
      createSelectorBundle({
        catalog: { worlds: "bad", courses: [] },
        map: { venues: [{ slug: 1, name: 2 }] },
        offers: { offersByQuest: ["bad"] },
      }),
    );
    expect(malformed.catalog).toBe("malformed");
    expect(malformed.map).toBe("malformed");
    expect(malformed.offers).toBe("malformed");
  });

  it("counts every stable status bucket including zero buckets", () => {
    const counts = selectStatusCounts(createSelectorBundle());
    expect(counts.courses).toEqual({
      active: 1,
      inactive: 1,
      unknown: 1,
    });
    expect(counts.venues).toEqual({
      listed: 1,
      hidden: 1,
      unknown: 0,
    });
    expect(counts.offers).toEqual({
      archived: 1,
      full: 1,
      available: 1,
      unknown: 0,
    });
  });

  it("skips malformed internal rows without throwing", () => {
    const bundle = createSelectorBundle({
      catalog: {
        worlds: [
          { slug: "world-alpha", name: "Synthetic World Alpha" },
          null,
          "bad",
          { slug: "", name: "Synthetic World Beta" },
        ],
        courses: [
          {
            slug: "course-alpha",
            worldSlug: "world-alpha",
            title: "Synthetic Course Alpha",
            activeInCampaign: true,
          },
          { slug: "course-beta", title: "Synthetic Course Beta" },
          42,
        ],
      },
      map: {
        venues: [
          { slug: "venue-alpha", name: "Synthetic Venue Alpha" },
          { name: "Synthetic Venue Beta" },
          false,
        ],
      },
      offers: {
        offersByQuest: {
          "course-alpha": [
            { id: "offer-alpha", venueSlug: "venue-alpha" },
            { id: "offer-beta" },
            null,
          ],
        },
      },
    });

    expect(() => selectSnapshotReadModel(bundle)).not.toThrow();
    const model = selectSnapshotReadModel(bundle);
    expect(model.worlds).toHaveLength(1);
    expect(model.courses).toHaveLength(1);
    expect(model.venues).toHaveLength(1);
    expect(model.offers).toHaveLength(1);
    expect(selectEntityCounts(bundle)).toEqual({
      worlds: 1,
      courses: 1,
      venues: 1,
      offers: 1,
    });
  });

  it("skips malformed offer groups and keys", () => {
    const bundle = createSelectorBundle({
      offers: {
        offersByQuest: {
          "": [{ id: "offer-alpha", venueSlug: "venue-alpha" }],
          "course-alpha": "not-array",
          "course-beta": [
            { id: "offer-beta", venueSlug: "venue-beta" },
            { venueSlug: "venue-beta" },
          ],
        },
      },
    });
    const offers = selectOfferSummaries(bundle);
    expect(offers).toEqual([
      expect.objectContaining({
        id: "offer-beta",
        courseId: "course-beta",
        venueId: "venue-beta",
      }),
    ]);
  });

  it("rejects empty and overlong identity fields", () => {
    const overlong = "y".repeat(161);
    const bundle = createSelectorBundle({
      catalog: {
        worlds: [
          { slug: "world-alpha", name: "Synthetic World Alpha" },
          { slug: overlong, name: "Synthetic World Beta" },
          { slug: "   ", name: "Synthetic World Beta" },
        ],
        courses: [
          {
            slug: "course-alpha",
            worldSlug: "world-alpha",
            title: "Synthetic Course Alpha",
            activeInCampaign: true,
          },
          {
            slug: overlong,
            worldSlug: "world-alpha",
            title: "Synthetic Course Beta",
            activeInCampaign: false,
          },
        ],
      },
      map: {
        venues: [
          {
            slug: "venue-alpha",
            name: "Synthetic Venue Alpha",
            type: overlong,
            address: "   ",
            city: overlong,
          },
        ],
      },
    });
    expect(selectWorldSummaries(bundle)).toHaveLength(1);
    expect(selectCourseSummaries(bundle)).toHaveLength(1);
    expect(selectVenueSummaries(bundle)[0]).toMatchObject({
      type: null,
      address: null,
      city: null,
    });
  });

  it("does not coerce invalid numeric offer fields", () => {
    const bundle = createSelectorBundle({
      offers: {
        offersByQuest: {
          "course-alpha": [
            {
              id: "offer-alpha",
              venueSlug: "venue-alpha",
              enrolled: "4",
              maxCapacity: "10",
            },
            {
              id: "offer-beta",
              venueSlug: "venue-alpha",
              enrolled: -1,
              maxCapacity: 0,
            },
            {
              id: "offer-gamma",
              venueSlug: "venue-alpha",
              enrolled: 1.5,
              maxCapacity: 2.5,
            },
          ],
        },
      },
    });
    const offers = selectOfferSummaries(bundle);
    for (const offer of offers) {
      expect(offer.enrolled).toBeNull();
      expect(offer.capacity).toBeNull();
      expect(offer.available).toBeNull();
      expect(offer.availability).toBe("unknown");
    }
  });

  it("does not mutate or reorder the source bundle", () => {
    const bundle = createSelectorBundle();
    const before = serializeBundle(bundle);
    selectSnapshotReadModel(bundle);
    selectWorldSummaries(bundle);
    selectCourseSummaries(bundle);
    selectVenueSummaries(bundle);
    selectOfferSummaries(bundle);
    selectEntityCounts(bundle);
    selectCollectionStatuses(bundle);
    selectStatusCounts(bundle);
    expect(serializeBundle(bundle)).toBe(before);
  });

  it("returns deterministic fresh read model objects", () => {
    const bundle = createSelectorBundle();
    const first = selectSnapshotReadModel(bundle);
    const second = selectSnapshotReadModel(bundle);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.worlds).not.toBe(second.worlds);
    expect(first.courses).not.toBe(second.courses);
    expect(first.venues).not.toBe(second.venues);
    expect(first.offers).not.toBe(second.offers);
    expect(first.worlds[0]).not.toBe(second.worlds[0]);
    expect(first.courses[0]).not.toBe(second.courses[0]);
    expect(first.venues[0]).not.toBe(second.venues[0]);
    expect(first.offers[0]).not.toBe(second.offers[0]);
  });

  it("keeps aggregate counts and status counts consistent with summaries", () => {
    const bundle = createSelectorBundle();
    const model: SnapshotReadModel = selectSnapshotReadModel(bundle);
    const worlds = selectWorldSummaries(bundle);
    const courses = selectCourseSummaries(bundle);
    const venues = selectVenueSummaries(bundle);
    const offers = selectOfferSummaries(bundle);

    expect(model.worlds).toEqual(worlds);
    expect(model.courses).toEqual(courses);
    expect(model.venues).toEqual(venues);
    expect(model.offers).toEqual(offers);
    expect(model.counts).toEqual({
      worlds: worlds.length,
      courses: courses.length,
      venues: venues.length,
      offers: offers.length,
    });
    expect(model.counts).toEqual(selectEntityCounts(bundle));
    expect(model.collectionStatuses).toEqual(selectCollectionStatuses(bundle));
    expect(model.statusCounts).toEqual(selectStatusCounts(bundle));
  });
});
