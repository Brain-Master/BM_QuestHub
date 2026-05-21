#!/usr/bin/env node
/**
 * Pull designer files from Google Drive Sync/ into apps/web/media/inbox/.
 * Usage: node scripts/pull-media-inbox-from-drive.mjs
 */
import { runTsxScript } from "./lib/run-tsx.mjs";

runTsxScript("ts/media-drive-pull.ts", process.argv.slice(2));
