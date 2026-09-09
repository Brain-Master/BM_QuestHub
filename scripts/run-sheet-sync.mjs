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
import { annualOverlayArgs } from "./annual-publish-tier.mjs";

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
if (tier === "hot") {
  const refresh = spawnSync(process.execPath, [tsx, "--tsconfig", tsconfig,
    path.join(ROOT, "scripts", "refresh-annual-from-published.ts")],
  { cwd: ROOT, stdio: "inherit", env: process.env });
  if (refresh.status !== 0) process.exit(refresh.status ?? 1);
}
const result = spawnSync(
  process.execPath,
  [tsx, "--tsconfig", tsconfig, runner, tier],
  {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  },
);

if (result.status !== 0) process.exit(result.status ?? 1);

// Retain the reviewed CSV-backed annual groups/venues after the Sheets refresh.
// The compiler validates the joined bundle but writes only the selected tier.
const overlay = spawnSync(process.execPath, [
  tsx, "--tsconfig", tsconfig,
  path.join(ROOT, "scripts", "integrate-year-schedule.ts"), ...annualOverlayArgs(tier),
], { cwd: ROOT, stdio: "inherit", env: process.env });
process.exit(overlay.status ?? 1);
