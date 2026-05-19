/**
 * Run from repo root: npx tsx scripts/ts/sync-runner.ts hot|cold [--write-only]
 * Loads scripts/s3.env via parent run-sheet-sync.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { resolveContentSlugSets } from "../../apps/web/lib/content/content-slugs.ts";

function webRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "apps", "web", "data"))) {
    return path.join(cwd, "apps", "web");
  }
  if (fs.existsSync(path.join(cwd, "data"))) {
    return cwd;
  }
  throw new Error("Run from repository root or apps/web");
}

function offersPath(): string {
  return path.join(webRoot(), "data", "offers-snapshot.json");
}

async function writeOffersSnapshot(
  snapshot: Awaited<ReturnType<typeof syncHotOffersFromGoogleSheet>>["snapshot"],
): Promise<void> {
  const file = offersPath();
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const body = `${JSON.stringify(snapshot, null, 2)}\n`;
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, body, "utf8");
  fs.renameSync(tmp, file);
  console.log(`[sync-runner] wrote ${path.relative(process.cwd(), file)}`);
}

async function runHot(): Promise<void> {
  const { syncHotOffersFromGoogleSheet } = await import(
    "../../apps/web/lib/offers/sync-hot-core.ts"
  );
  const { venueSlugs, questSlugs } = resolveContentSlugSets();
  const result = await syncHotOffersFromGoogleSheet({ venueSlugs, questSlugs });
  await writeOffersSnapshot(result.snapshot);
  console.log(
    `[sync-runner] hot OK: ${result.rowCount} shifts, quests=${result.questKeys.join(", ")}`,
  );
}

async function runCold(): Promise<void> {
  const { syncColdContentFromGoogleSheet, writeColdSnapshotsToDisk } =
    await import("../../apps/web/lib/content/sync-cold-core.ts");
  const result = await syncColdContentFromGoogleSheet();
  const root = writeColdSnapshotsToDisk(result.bundle);
  console.log(
    `[sync-runner] cold OK: ${result.worlds} worlds, ${result.venues} venues, ${result.courses} courses → ${root}`,
  );
}

async function main(): Promise<void> {
  const tier = process.argv[2];
  if (tier !== "hot" && tier !== "cold") {
    console.error("Usage: sync-runner.ts hot|cold");
    process.exit(1);
  }
  if (tier === "hot") await runHot();
  else await runCold();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
