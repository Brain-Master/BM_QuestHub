#!/usr/bin/env node
/**
 * Content publish pipeline:
 *   --hot-only   → validate + s3-sync-data-hot (no Timeweb deploy)
 *   --cold       → validate + s3-sync-data-cold + Timeweb API deploy (default)
 *   --skip-export / --skip-deploy
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { triggerContentDeploy } from "./deploy-hook.mjs";
import { annualOverlayArgs } from "../../scripts/annual-publish-tier.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NODE = process.execPath;

const args = new Set(process.argv.slice(2));
const skipExport = args.has("--skip-export");
const skipDeploy = args.has("--skip-deploy");
const hotOnly = args.has("--hot-only");
const coldOnly = args.has("--cold");

function run(label, scriptRelative, scriptArgs = []) {
  console.log(`[producer] ${label}`);
  const script = path.join(ROOT, scriptRelative);
  const result = spawnSync(NODE, [script, ...scriptArgs], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runMake(target) {
  console.log(`[producer] make ${target}`);
  const makeCmd = process.platform === "win32" ? "make.exe" : "make";
  const result = spawnSync(makeCmd, [target], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const tier = hotOnly ? "hot" : "cold";

  if (!skipExport && coldOnly) {
    run("export YAML", "scripts/export-yaml-to-snapshots.mjs");
  } else if (!skipExport && !hotOnly) {
    run("export YAML", "scripts/export-yaml-to-snapshots.mjs");
  }

  run("preserve annual programmes", "apps/web/node_modules/tsx/dist/cli.mjs", [
    "--tsconfig", path.join(ROOT, "apps/web/tsconfig.json"),
    path.join(ROOT, "scripts/integrate-year-schedule.ts"), ...annualOverlayArgs(tier),
  ]);
  run("validate snapshots", "scripts/validate-public-snapshot.mjs");
  runMake("scripts-s3-deps");
  runMake(hotOnly ? "s3-sync-data-hot" : "s3-sync-data-cold");

  if (!skipDeploy) {
    await triggerContentDeploy(tier);
  } else {
    console.log("[producer] skip deploy (--skip-deploy)");
  }

  console.log(`[producer] publish complete (tier=${tier})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
