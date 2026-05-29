#!/usr/bin/env node
/**
 * Sync Timeweb App Platform build env from apps/web/timeweb.app.env.example.
 *
 *   node scripts/timeweb-sync-app-env.mjs
 *   node scripts/timeweb-sync-app-env.mjs --dry-run
 *
 * Requires TIMEWEB_API_TOKEN and TIMEWEB_APP_ID in scripts/timeweb.env
 */
import fs from "node:fs";
import path from "node:path";

import { loadRepoEnv } from "./load-dotenv.mjs";
import { timewebApi, unwrapApp } from "./timeweb-vcs.mjs";

const ROOT = loadRepoEnv();
const EXAMPLE = path.join(ROOT, "apps", "web", "timeweb.app.env.example");

function readExampleEnvs() {
  const envs = {};
  if (!fs.existsSync(EXAMPLE)) {
    throw new Error(`missing ${path.relative(ROOT, EXAMPLE)}`);
  }
  for (const line of fs.readFileSync(EXAMPLE, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (v) envs[k] = v;
  }
  return envs;
}

function parseCli() {
  return { dryRun: process.argv.includes("--dry-run") };
}

async function main() {
  const { dryRun } = parseCli();
  const token = process.env.TIMEWEB_API_TOKEN?.trim();
  const appId = process.env.TIMEWEB_APP_ID?.trim();
  if (!token) {
    console.error("[timeweb-sync-env] set TIMEWEB_API_TOKEN in scripts/timeweb.env");
    process.exit(1);
  }
  if (!appId) {
    console.error("[timeweb-sync-env] set TIMEWEB_APP_ID in scripts/timeweb.env");
    process.exit(1);
  }

  const desired = readExampleEnvs();
  const body = await timewebApi(token, `/api/v1/apps/${appId}`);
  const app = unwrapApp(body);
  const current = { ...(app.envs ?? app.environment ?? {}) };

  const changed = [];
  for (const [key, value] of Object.entries(desired)) {
    if (current[key] !== value) changed.push(key);
  }

  console.log(`[timeweb-sync-env] app=${appId} desired=${Object.keys(desired).length} changed=${changed.length}`);
  if (changed.length > 0) {
    for (const key of changed) {
      console.log(`  ${key}: ${current[key] ?? "(missing)"} -> ${desired[key]}`);
    }
  } else {
    console.log("[timeweb-sync-env] env already matches timeweb.app.env.example");
  }

  const s3 = desired.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ?? "";
  if (!s3.includes("storage.yandexcloud.net")) {
    console.warn("[timeweb-sync-env] WARN: NEXT_PUBLIC_S3_PUBLIC_BASE_URL is not Yandex Object Storage");
  }

  if (dryRun) return;

  if (changed.length === 0) return;

  await timewebApi(token, `/api/v1/apps/${appId}`, {
    method: "PATCH",
    body: JSON.stringify({ envs: desired }),
  });
  console.log("[timeweb-sync-env] PATCH ok — redeploy required for NEXT_PUBLIC_* to reach the bundle");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
