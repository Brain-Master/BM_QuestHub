#!/usr/bin/env node
/**
 * Sync Google Sheets → local apps/web/data (hot or cold).
 * Usage: node scripts/run-sheet-sync.mjs hot|cold
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

const tier = process.argv[2];
if (tier !== "hot" && tier !== "cold") {
  console.error("Usage: node scripts/run-sheet-sync.mjs hot|cold");
  process.exit(1);
}

function findTsx() {
  const candidates = [
    path.join(ROOT, "apps", "web", "node_modules", "tsx", "dist", "cli.mjs"),
    path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"),
    path.join(ROOT, "scripts", "node_modules", "tsx", "dist", "cli.mjs"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const tsx = findTsx();
const runner = path.join(__dirname, "ts", "sync-runner.ts");

if (!tsx) {
  console.error(
    "[run-sheet-sync] tsx not found. Run: cd apps/web && npm install -D tsx",
  );
  process.exit(1);
}

const tsconfig = path.join(ROOT, "apps", "web", "tsconfig.json");
const result = spawnSync(
  process.execPath,
  [tsx, "--tsconfig", tsconfig, runner, tier],
  {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(result.status ?? 1);
