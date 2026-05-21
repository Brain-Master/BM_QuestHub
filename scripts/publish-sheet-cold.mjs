#!/usr/bin/env node
/**
 * Cold: Google Sheet → catalog/map snapshots → S3 → Timeweb deploy.
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

run(process.execPath, [path.join(__dirname, "run-sheet-sync.mjs"), "cold"]);
run(process.execPath, [path.join(__dirname, "validate-public-snapshot.mjs")]);
run(process.execPath, [path.join(__dirname, "run-s3-sync.mjs"), "data-cold"]);
run(process.execPath, [path.join(__dirname, "run-s3-sync.mjs"), "media"]);
run(process.execPath, [path.join(__dirname, "timeweb-deploy.mjs")]);
console.log("[publish-sheet-cold] done — Timeweb rebuild 2–5 min");
