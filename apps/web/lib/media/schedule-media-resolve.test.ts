import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  clearScheduleMediaResolveCaches,
  coalesceScheduleMediaImage,
  isPlaceholderMediaUrl,
} from "./schedule-media-resolve";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("schedule-media-resolve", () => {
  it("detects placeholder outputs from manifest", () => {
    clearScheduleMediaResolveCaches();
    const manifestPath = path.join(WEB_ROOT, "data/media-ingest-manifest.json");
    if (!fs.existsSync(manifestPath)) return;

    const isPh = isPlaceholderMediaUrl(
      "media/venues/photos/bm-base-moscow/01.webp",
      WEB_ROOT,
    );
    assert.equal(isPh, true);
  });

  it("coalesceScheduleMediaImage falls back to quest hero for placeholder shift url", () => {
    clearScheduleMediaResolveCaches();
    const quest = {
      url: "media/quests/cyber-rhythm/hero.webp",
      alt: "Cyber Rhythm",
    };
    const resolved = coalesceScheduleMediaImage(
      { url: "media/venues/photos/bm-base-moscow/01.webp", alt: "shift" },
      quest,
      WEB_ROOT,
    );
    assert.equal(resolved?.url, quest.url);
  });

  it("keeps real schedule url when not listed as placeholder in manifest", () => {
    clearScheduleMediaResolveCaches();
    const shiftUrl = "media/quests/cyber-rhythm/hero.webp";
    const resolved = coalesceScheduleMediaImage(
      { url: shiftUrl, alt: "shift" },
      { url: "media/quests/other/hero.webp", alt: "other" },
      WEB_ROOT,
    );
    assert.equal(resolved?.url, shiftUrl);
  });
});
