#!/usr/bin/env node
/**
 * Export ops/mos-enrolled-stats.json hourly buckets to CSV (stdout).
 *
 *   node scripts/export-mos-enrolled-stats.mjs > mos-stats.csv
 */
import { readOpsJson } from "./lib/mos-ops-s3.mjs";
import { MOS_ENROLLED_STATS_KEY } from "./lib/mos-enrolled-events.mjs";
import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import path from "node:path";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "s3.env"));

async function main() {
  const stored = await readOpsJson(MOS_ENROLLED_STATS_KEY);
  const hourly = Array.isArray(stored?.data?.hourly) ? stored.data.hourly : [];
  console.log(
    "bucket,visits1h,enrolledDeltaSum,enrolledIncreaseEvents,syncRuns,urlsPolled,avgIntervalSec",
  );
  for (const row of hourly) {
    console.log(
      [
        row.bucket,
        row.visits1h ?? "",
        row.enrolledDeltaSum ?? "",
        row.enrolledIncreaseEvents ?? "",
        row.syncRuns ?? "",
        row.urlsPolled ?? "",
        row.avgIntervalSec ?? "",
      ].join(","),
    );
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
