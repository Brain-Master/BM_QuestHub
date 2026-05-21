import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  countOffersInSnapshot,
  parseOffersSnapshot,
} from "./snapshot-parse";

describe("parseOffersSnapshot", () => {
  it("accepts schedule media with S3-relative paths", () => {
    const file = path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      "data",
      "offers-snapshot.json",
    );
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
    const snapshot = parseOffersSnapshot(raw);
    assert.equal(countOffersInSnapshot(snapshot), 19);
  });

  it("accepts minimal offer with media/ hero url", () => {
    const snapshot = parseOffersSnapshot({
      version: 1,
      generatedAt: new Date().toISOString(),
      offersByQuest: {
        "cyber-rhythm": [
          {
            id: "test-1",
            venueSlug: "school-17-belyaevo",
            shiftLabel: "Test",
            startDate: "2026-06-22",
            endDate: "2026-06-26",
            startTime: "9:00",
            endTime: "13:00",
            dateRange: "22.06 — 26.06",
            daySchedule: "9:00–13:00",
            priceLabel: "10 000 ₽",
            scheduleCard: {
              media: {
                hero: {
                  url: "media/quests/cyber-rhythm/hero.webp",
                  alt: "Hero",
                },
              },
            },
          },
        ],
      },
    });
    assert.equal(countOffersInSnapshot(snapshot), 1);
  });
});
