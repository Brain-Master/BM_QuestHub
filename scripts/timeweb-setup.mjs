#!/usr/bin/env node
/**
 * One-shot: ensure bucket + s3.env, validate snapshots, upload data, verify HTTP.
 *
 *   node scripts/timeweb-setup.mjs
 */
import { spawnSync } from "node:child_process";
import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const BUCKET = process.env.S3_BUCKET?.trim() || "bm-questhub";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function verify() {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim()
    || `https://${BUCKET}.s3.twcstorage.ru`;
  const url = `${base.replace(/\/$/, "")}/data/v2/site-manifest.json`;
  console.log(`[timeweb-setup] GET ${url}`);
  const res = await fetch(url, { method: "HEAD" });
  console.log(`[timeweb-setup] ${res.status} ${res.statusText}`);
  if (!res.ok) process.exit(1);
}

async function main() {
  run(process.execPath, ["scripts/timeweb-provision-s3.mjs", "--setup", BUCKET]);
  run(process.execPath, ["scripts/validate-public-snapshot.mjs"]);
  run(process.execPath, ["scripts/run-s3-sync.mjs", "data"]);
  await verify();
  console.log("[timeweb-setup] S3 data upload OK");
  console.log(
    "\nApp Platform: follow docs/deployment/timeweb-deploy-checklist.md",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
