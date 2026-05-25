#!/usr/bin/env node
/**
 * Clear lockUntil in ops/mos-sync-state.json on active S3 bucket (hot).
 * Use when sync/controller left a stale lock after S3 timeouts.
 */
import { loadRepoEnv, loadS3Env } from "./load-dotenv.mjs";
import { mergeOpsJson, readOpsJsonWithMeta } from "./lib/mos-ops-s3.mjs";
import { MOS_SYNC_STATE_S3_KEY, normalizeSyncState } from "./lib/mos-sync-state.mjs";

loadRepoEnv();

async function main() {
  loadS3Env();
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) {
    console.error("[clear-lock] S3_BUCKET not set — run: make setup-s3-hot-env");
    process.exit(1);
  }

  const stored = await readOpsJsonWithMeta(MOS_SYNC_STATE_S3_KEY);
  const state = normalizeSyncState(stored.data);
  console.log(`[clear-lock] bucket=${bucket} key=${MOS_SYNC_STATE_S3_KEY}`);
  console.log(
    `[clear-lock] before lockUntil=${state.lockUntil ?? "null"} readOk=${stored.readOk}`,
  );

  const merged = await mergeOpsJson(MOS_SYNC_STATE_S3_KEY, (raw) => {
    const s = normalizeSyncState(raw);
    return { ...s, lockUntil: null };
  });

  if (merged === null) {
    console.error("[clear-lock] failed to patch state (S3 timeout?)");
    process.exit(1);
  }
  console.log("[clear-lock] ok — lockUntil cleared");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
