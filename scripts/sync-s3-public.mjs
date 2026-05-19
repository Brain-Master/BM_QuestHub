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
const ENDPOINT = process.env.S3_ENDPOINT?.trim() || "https://s3.twcstorage.ru";
const REGION = process.env.AWS_DEFAULT_REGION?.trim() || "ru-1";

const TARGETS = {
  data: {
    local: path.join(WEB, "data"),
    remote: "s3://${bucket}/data",
    cacheControl: "public, max-age=60",
    validate: true,
  },
  media: {
    local: process.env.S3_MEDIA_LOCAL_PATH?.trim()
      || path.join(WEB, "media"),
    remote: "s3://${bucket}/media",
    cacheControl: "public, max-age=31536000, immutable",
    validate: false,
    optional: true,
  },
  static: {
    local: path.join(WEB, "out"),
    remote: "s3://${bucket}",
    cacheControl: "public, max-age=3600",
    validate: false,
    requiresBuild: true,
  },
};

function die(msg) {
  console.error(`[sync-s3-public] ${msg}`);
  process.exit(1);
}

function runAws(args) {
  const result = spawnSync("aws", args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) {
    die(`aws CLI failed: ${result.error.message}. Install AWS CLI v2.`);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
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

function syncTarget(name, config, bucket) {
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
  const args = [
    "s3",
    "sync",
    local,
    remote,
    "--endpoint-url",
    ENDPOINT,
    "--region",
    REGION,
    "--delete",
    "--cache-control",
    config.cacheControl,
  ];

  console.log(`[sync-s3-public] ${name}: ${local} -> ${remote}`);
  runAws(args);
}

const targetArg = process.argv[2] || "all";
const bucket = process.env.S3_BUCKET?.trim();
if (!bucket) die("set S3_BUCKET");
if (!process.env.AWS_ACCESS_KEY_ID?.trim() || !process.env.AWS_SECRET_ACCESS_KEY?.trim()) {
  die("set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (S3 keys from bucket dashboard)");
}

const names =
  targetArg === "all"
    ? Object.keys(TARGETS)
    : targetArg.split(",").map((s) => s.trim());

for (const name of names) {
  const config = TARGETS[name];
  if (!config) die(`unknown target "${name}"; use: data | media | static | all`);
  if (config.validate) validateSnapshots();
  syncTarget(name, config, bucket);
}

console.log("[sync-s3-public] done");
