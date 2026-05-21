#!/usr/bin/env node
/**
 * Hot: Google Sheet → local JSON → S3 (no Timeweb rebuild).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, [path.join(__dirname, "run-sheet-sync.mjs"), "hot"]);
run(process.execPath, [path.join(__dirname, "validate-public-snapshot.mjs")]);
run(process.execPath, [path.join(__dirname, "run-s3-sync.mjs"), "data-hot"]);
run(process.execPath, [path.join(__dirname, "run-s3-sync.mjs"), "media"]);
console.log("[publish-sheet-hot] done — site updates in ~1 min");
