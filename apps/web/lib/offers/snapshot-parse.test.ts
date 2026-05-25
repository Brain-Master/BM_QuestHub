import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  countOffersInSnapshot,
  emptyOffersSnapshot,
  isDisplayableSnapshotGeneratedAt,
  isUsableOffersSnapshot,
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

describe("snapshot UI timestamps", () => {
  it("rejects epoch placeholder from emptyOffersSnapshot", () => {
    const empty = emptyOffersSnapshot();
    assert.equal(empty.source, "missing_or_unreadable");
    assert.equal(isDisplayableSnapshotGeneratedAt(empty.generatedAt), false);
    assert.equal(isUsableOffersSnapshot(empty), false);
  });

  it("accepts real google_sheet snapshot timestamps", () => {
    const snapshot = parseOffersSnapshot({
      version: 1,
      generatedAt: "2026-05-21T13:47:57.943Z",
      source: "google_sheet",
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
          },
        ],
      },
    });
    assert.equal(isDisplayableSnapshotGeneratedAt(snapshot.generatedAt), true);
    assert.equal(isUsableOffersSnapshot(snapshot), true);
  });
});
