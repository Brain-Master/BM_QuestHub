import { expect, test } from "@playwright/test";

import siteConfig from "../data/v2/site-config.json";
import offersSnapshot from "../data/offers-snapshot.json";
import { findPrivateFieldViolations } from "../lib/data/v2/private-field-denylist";
import { siteConfigSchema } from "../lib/data/v2/site-config";
import { offersSnapshotV1ToScheduleV2 } from "../lib/data/v2/v1-to-v2";
import { parseOffersSnapshot } from "../lib/offers/snapshot-parse";

test.describe("Site config V2", () => {
  test("site-config.json matches schema and has no private fields", () => {
    const parsed = siteConfigSchema.safeParse(siteConfig);
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.flatten())).toBe(
      true,
    );
    expect(findPrivateFieldViolations(siteConfig)).toEqual([]);
    expect(siteConfig.brand.contacts.supportTelegramUrl).toBe(
      "https://t.me/BrainMaster_Academy",
    );
    expect(siteConfig.brand.contacts.supportTelegramLabel).toBeTruthy();
    expect(siteConfig.brand.contacts.communityVkUrl).toBe(
      "https://vk.com/BrainMaster",
    );
    expect(siteConfig.brand.contacts.communityVkLabel).toBeTruthy();
    expect(siteConfig.brand.contacts.communityVkLead).toBeTruthy();
  });

  test("V1 offers snapshot converts to schedule V2 events", () => {
    const schedule = offersSnapshotV1ToScheduleV2(parseOffersSnapshot(offersSnapshot));
    expect(schedule.version).toBe(2);
    expect(schedule.events.length).toBeGreaterThan(0);
    expect(findPrivateFieldViolations(schedule)).toEqual([]);
    const first = schedule.events[0];
    expect(first?.relations.courseId).toBeTruthy();
    expect(first?.status.value).toBeTruthy();
  });

  test("navigation lists only known world slugs from content", () => {
    const slugs = siteConfig.navigation.worldGroups.map((g) => g.slug);
    expect(slugs).toContain("minecraft");
    expect(slugs).toContain("mekhvarium");
  });
});
