import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { ensureMediaInboxScaffold } from "./ensure-media-inbox-scaffold";
import { ingestMediaFromInbox } from "./ingest-media-inbox";
import type { ColdSnapshotBundle } from "@/lib/content/sync-cold-core";

function tmpWebRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bm-media-"));
  for (const sub of ["media/inbox", "media/placeholders", "media", "public", "data"]) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true });
  }
  const srcPlaceholders = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../media/placeholders",
  );
  if (fs.existsSync(srcPlaceholders)) {
    for (const name of fs.readdirSync(srcPlaceholders)) {
      if (name.endsWith(".webp")) {
        fs.copyFileSync(
          path.join(srcPlaceholders, name),
          path.join(dir, "media/placeholders", name),
        );
      }
    }
  }
  return dir;
}

function minimalBundle(): ColdSnapshotBundle {
  const generatedAt = new Date().toISOString();
  const course = {
    slug: "demo-quest",
    worldSlug: "demo-world",
    title: "Demo",
    tagline: "Tag",
    ageLabel: "10+",
    format: "intensive" as const,
    skills: ["s"],
    activeInCampaign: true,
    story: "story",
    skillsParent: "p",
    loot: "l",
    approach: "a",
    offers: [],
  };
  return {
    catalog: {
      version: 2,
      generatedAt,
      source: "test",
      integrity: { contentHash: "x" },
      worlds: [
        {
          slug: "demo-world",
          name: "World",
          description: "Desc",
          themeKey: "cyber",
          tagline: "T",
          pitch: "P",
          highlights: ["h"],
        },
      ],
      courses: [course],
    },
    map: {
      version: 2,
      generatedAt,
      source: "test",
      integrity: { contentHash: "y" },
      venues: [
        {
          slug: "demo-school",
          name: "School",
          type: "school" as const,
          address: "Addr",
          listedOnSites: true,
          directions: [],
          schoolScopeSlug: "demo-school",
        },
      ],
    },
    details: [{ slug: "demo-quest", course }],
  };
}

describe("media inbox pipeline", () => {
  it("scaffold copies placeholder; ingest writes webp only for real sources", async () => {
    const webRoot = tmpWebRoot();
    const bundle = minimalBundle();
    const context = {
      questSlugs: ["demo-quest"],
      worldSlugs: ["demo-world"],
      venues: [{ scopeSlug: "demo-school", venueSlug: "demo-school" }],
      shiftGroupIds: [],
    };

    const scaffold = ensureMediaInboxScaffold(context, { webRoot });
    assert.ok(scaffold.placeholderCount >= 1);

    const sourcePath = path.join(
      webRoot,
      "media/inbox/quests/demo-quest/hero-16x9.source.jpg",
    );
    assert.ok(fs.existsSync(sourcePath));
    const ph = fs.readFileSync(
      path.join(webRoot, "media/placeholders/quest-hero-16x9.placeholder.webp"),
    );
    fs.writeFileSync(sourcePath, Buffer.concat([ph, Buffer.from([0x00])]));

    const result = await ingestMediaFromInbox({
      webRoot,
      context,
      coldBundle: bundle,
    });
    assert.equal(result.errors.length, 0);

    const heroOut = path.join(webRoot, "media/quests/demo-quest/hero.webp");
    assert.ok(fs.existsSync(heroOut));
    assert.equal(bundle.catalog.courses[0]?.heroImageUrl, "media/quests/demo-quest/hero.webp");
  });
});
