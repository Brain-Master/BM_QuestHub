#!/usr/bin/env node
/**
 * Push media/inbox scaffold to Google Drive Sync/.
 * Usage: node scripts/sync-media-inbox-to-drive.mjs [--force]
 */
import { runTsxScript } from "./lib/run-tsx.mjs";

runTsxScript("ts/media-drive-push.ts", process.argv.slice(2));
