#!/usr/bin/env node
/**
 * Sync public Quest Hub assets to S3-compatible object storage (Timeweb by default).
 *
 * Required env (see scripts/s3.env.example):
 *   S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * Optional:
 *   S3_ENDPOINT (default https://s3.twcstorage.ru)
 *   AWS_DEFAULT_REGION (default ru-1)
 *
 * Usage:
 *   node scripts/sync-s3-public.mjs data-hot
 *   node scripts/sync-s3-public.mjs data-cold
 *   node scripts/sync-s3-public.mjs data-hot,data-cold
 *   node scripts/sync-s3-public.mjs data
 *   node scripts/sync-s3-public.mjs media
 *   node scripts/sync-s3-public.mjs static
 *   node scripts/sync-s3-public.mjs all
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "apps", "web");
const DATA_DIR = path.join(WEB, "data");
const OFFERS_SNAPSHOT = path.join(DATA_DIR, "offers-snapshot.json");
const DATA_V2 = path.join(DATA_DIR, "v2");
const ENDPOINT = process.env.S3_ENDPOINT?.trim() || "https://s3.twcstorage.ru";
const REGION = process.env.AWS_DEFAULT_REGION?.trim() || "ru-1";

const TARGETS = {
  "data-hot": {
    local: OFFERS_SNAPSHOT,
    remote: "s3://${bucket}/data/offers-snapshot.json",
    cacheControl: "public, max-age=60",
    validate: true,
    mode: "cp",
  },
  "data-cold": {
    local: DATA_V2,
    remote: "s3://${bucket}/data/v2",
    cacheControl: "public, max-age=60",
    validate: true,
    mode: "sync",
    delete: true,
  },
  data: {
    local: DATA_DIR,
    remote: "s3://${bucket}/data",
    cacheControl: "public, max-age=60",
    validate: true,
    mode: "sync",
    delete: true,
  },
  media: {
    local: process.env.S3_MEDIA_LOCAL_PATH?.trim()
      || path.join(WEB, "media"),
    remote: "s3://${bucket}/media",
    cacheControl: "public, max-age=31536000, immutable",
    validate: false,
    mode: "sync",
    delete: true,
  },
  static: {
    local: path.join(WEB, "out"),
    remote: "s3://${bucket}",
    cacheControl: "public, max-age=3600",
    validate: false,
    requiresBuild: true,
    mode: "sync",
    delete: true,
  },
};

/** Full bootstrap targets (excludes tier-specific data-hot / data-cold). */
const ALL_TARGETS = ["data", "media", "static"];

const TARGET_HELP = "data-hot | data-cold | data | media | static | all";

function die(msg) {
  console.error(`[sync-s3-public] ${msg}`);
  process.exit(1);
}

function awsAvailable() {
  const probe = spawnSync("aws", ["--version"], {
    env: process.env,
    shell: process.platform === "win32",
    stdio: "ignore",
  });
  return !probe.error && probe.status === 0;
}

async function runSdkSync(targetArg) {
  await import("./sync-s3-sdk.mjs").then((m) => m.runS3SdkSync(targetArg));
}

function runAws(args) {
  const result = spawnSync("aws", args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) {
    return false;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return true;
}

function validateSnapshots() {
  const validator = path.join(ROOT, "scripts", "validate-public-snapshot.mjs");
  const result = spawnSync(process.execPath, [validator], {
    stdio: "inherit",
    cwd: ROOT,
  });
  if (result.status !== 0) {
    die("validate-public-snapshot failed; fix JSON before upload");
  }
}

function resolveNames(targetArg) {
  if (targetArg === "all") return ALL_TARGETS;
  return targetArg.split(",").map((s) => s.trim());
}

async function syncTarget(name, config, bucket) {
  const local = config.local;
  if (!fs.existsSync(local)) {
    if (config.optional) {
      console.warn(
        `[sync-s3-public] skip ${name}: no ${path.relative(ROOT, local)} (see apps/web/media/README.md)`,
      );
      return;
    }
    if (config.requiresBuild) {
      die(`missing ${path.relative(ROOT, local)} — run: cd apps/web && npm run build`);
    }
    die(`missing local path: ${path.relative(ROOT, local)}`);
  }

  const remote = config.remote.replace("${bucket}", bucket);
  const baseArgs = ["--endpoint-url", ENDPOINT, "--region", REGION, "--cache-control", config.cacheControl];

  if (config.mode === "cp") {
    console.log(`[sync-s3-public] ${name}: ${local} -> ${remote}`);
    runAws(["s3", "cp", local, remote, ...baseArgs]);
    return;
  }

  const args = ["s3", "sync", local, remote, ...baseArgs];
  if (config.delete) args.push("--delete");

  console.log(`[sync-s3-public] ${name}: ${local} -> ${remote}`);
  runAws(args);
}

const targetArg = process.argv[2] || "all";
const bucket = process.env.S3_BUCKET?.trim();
if (!bucket) die("set S3_BUCKET");
if (!process.env.AWS_ACCESS_KEY_ID?.trim() || !process.env.AWS_SECRET_ACCESS_KEY?.trim()) {
  die("set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (S3 keys from bucket dashboard)");
}

const names = resolveNames(targetArg);

async function main() {
  if (!awsAvailable()) {
    console.warn("[sync-s3-public] AWS CLI not found — using @aws-sdk/client-s3");
    if (names.some((n) => TARGETS[n]?.validate)) validateSnapshots();
    await runSdkSync(targetArg);
    return;
  }

  for (const name of names) {
    const config = TARGETS[name];
    if (!config) die(`unknown target "${name}"; use: ${TARGET_HELP}`);
    if (config.validate) validateSnapshots();
    await syncTarget(name, config, bucket);
  }
  console.log("[sync-s3-public] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
