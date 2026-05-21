/**

 * Run from repo root: npx tsx scripts/ts/sync-runner.ts hot|cold

 * Loads scripts/sheets.env via parent run-sheet-sync.mjs

 */

import fs from "node:fs";

import path from "node:path";



import { resolveContentSlugSets } from "../../apps/web/lib/content/content-slugs.ts";

import type { ColdSnapshotBundle } from "../../apps/web/lib/content/sync-cold-core.ts";

import type { OffersSnapshotV1 } from "../../apps/web/lib/offers/snapshot-types.ts";

import { sendTelegramAlert } from "../../apps/web/lib/offers/telegram.ts";

const onAlert = sendTelegramAlert;



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



async function writeOffersSnapshot(snapshot: OffersSnapshotV1): Promise<void> {

  const file = offersPath();

  const dir = path.dirname(file);

  fs.mkdirSync(dir, { recursive: true });

  const body = `${JSON.stringify(snapshot, null, 2)}\n`;

  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;

  fs.writeFileSync(tmp, body, "utf8");

  fs.renameSync(tmp, file);

  console.log(`[sync-runner] wrote ${path.relative(process.cwd(), file)}`);

}



async function runMediaPipeline(input: {

  coldBundle?: ColdSnapshotBundle;

  hotSnapshot?: OffersSnapshotV1;

}): Promise<void> {

  if (process.env.SKIP_MEDIA_INGEST === "1") {

    console.log("[sync-runner] SKIP_MEDIA_INGEST=1 — media pipeline skipped");

    return;

  }



  const root = webRoot();

  const { buildMediaInboxContext, ingestMediaFromInbox } = await import(

    "../../apps/web/lib/media/ingest-media-inbox.ts"

  );

  const { ensureMediaInboxScaffold } = await import(

    "../../apps/web/lib/media/ensure-media-inbox-scaffold.ts"

  );



  const context = buildMediaInboxContext(input);

  ensureMediaInboxScaffold(context, { webRoot: root });



  const ingestResult = await ingestMediaFromInbox({

    webRoot: root,

    context,

    coldBundle: input.coldBundle,

    hotSnapshot: input.hotSnapshot,

  });



  if (ingestResult.errors.length > 0 && process.env.MEDIA_INGEST_STRICT === "1") {

    throw new Error(`Media ingest failed (${ingestResult.errors.length} errors)`);

  }

}



async function runHot(): Promise<void> {

  const { syncHotOffersFromGoogleSheet } = await import(

    "../../apps/web/lib/offers/sync-hot-core.ts"

  );

  const { venueSlugs, questSlugs } = resolveContentSlugSets();

  const result = await syncHotOffersFromGoogleSheet({
    venueSlugs,
    questSlugs,
    onAlert,
  });

  await runMediaPipeline({ hotSnapshot: result.snapshot });

  await writeOffersSnapshot(result.snapshot);

  console.log(

    `[sync-runner] hot OK: ${result.rowCount} shifts, quests=${result.questKeys.join(", ")}`,

  );

}



async function runCold(): Promise<void> {

  const { syncColdContentFromGoogleSheet, writeColdSnapshotsToDisk } =

    await import("../../apps/web/lib/content/sync-cold-core.ts");

  const result = await syncColdContentFromGoogleSheet({ onAlert });

  await runMediaPipeline({ coldBundle: result.bundle });

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


