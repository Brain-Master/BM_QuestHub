#!/usr/bin/env node
/**
 * Smoke: dry-run planner invoke (no YMQ messages when dryRun).
 *
 *   node scripts/smoke-mos-ymq-pipeline.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");
const PLANNER = "bm-mos-sync-planner";

function main() {
  if (!fs.existsSync(YC)) {
    console.error("[smoke] yc not found");
    process.exit(1);
  }
  const deploy = path.join(ROOT, "secret", "mos-ymq-pipeline.deploy.txt");
  if (!fs.existsSync(deploy)) {
    console.error("[smoke] run deploy-yandex-mos-ymq-pipeline first");
    process.exit(1);
  }

  console.log(`[smoke] invoke ${PLANNER} dryRun=true`);
  const r = spawnSync(
    YC,
    [
      "serverless",
      "function",
      "invoke",
      "--name",
      PLANNER,
      "--data",
      '{"dryRun":true,"source":"smoke"}',
    ],
    { encoding: "utf8", timeout: 130_000 },
  );
  console.log(r.stdout || r.stderr);
  process.exit(r.status === 0 ? 0 : 1);
}

main();
