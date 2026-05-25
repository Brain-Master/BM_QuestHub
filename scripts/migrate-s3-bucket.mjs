#!/usr/bin/env node
/**
 * Copy all objects from legacy cold bucket to hot bucket (same Timeweb account/keys).
 *
 *   node scripts/migrate-s3-bucket.mjs --dry-run
 *   node scripts/migrate-s3-bucket.mjs
 *   node scripts/migrate-s3-bucket.mjs --source bm-questhub --dest bm-quest-s3-hot
 *
 * Env: scripts/s3.env or secret/bm-questhub-s3-hot.txt (via setup-s3-hot-env.mjs).
 */
import {
  CopyObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepoEnv, loadS3Env } from "./load-dotenv.mjs";
import { parseTimewebS3SecretFile } from "./lib/parse-timeweb-s3-secret.mjs";
import {
  S3_ENDPOINT_DEFAULT,
  S3_REGION_DEFAULT,
  S3_STORAGE_DEFAULTS,
  applyHotS3Env,
} from "./lib/s3-storage.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1]?.trim() || fallback : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function ensureCreds() {
  if (process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim()) {
    return;
  }
  const secretPath = path.join(ROOT, "secret", "bm-questhub-s3-hot.txt");
  const parsed = parseTimewebS3SecretFile(secretPath);
  applyHotS3Env(parsed);
}

/**
 * @param {string} sourceBucket
 * @param {string} destBucket
 */
async function listAllKeys(client, sourceBucket) {
  /** @type {{ key: string, size: number, etag?: string }[]} */
  const keys = [];
  let token;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: sourceBucket,
        ContinuationToken: token,
      }),
    );
    for (const o of res.Contents || []) {
      if (!o.Key || o.Key.endsWith("/")) continue;
      keys.push({
        key: o.Key,
        size: o.Size ?? 0,
        etag: o.ETag,
      });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

function createClient() {
  return new S3Client({
    region: process.env.AWS_DEFAULT_REGION?.trim() || S3_REGION_DEFAULT,
    endpoint: process.env.S3_ENDPOINT?.trim() || S3_ENDPOINT_DEFAULT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    },
  });
}

/**
 * @param {S3Client} client
 * @param {string} bucket
 * @param {string} key
 */
async function headExists(client, bucket, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  loadS3Env();
  ensureCreds();

  const source =
    arg("--source") ||
    process.env.S3_LEGACY_BUCKET?.trim() ||
    S3_STORAGE_DEFAULTS.legacy.bucket;
  const dest =
    arg("--dest") ||
    process.env.S3_BUCKET?.trim() ||
    S3_STORAGE_DEFAULTS.hot.bucket;
  const dryRun = hasFlag("--dry-run");
  const skipExisting = !hasFlag("--force");

  const client = createClient();
  console.log(`[migrate-s3] source=s3://${source}/ → dest=s3://${dest}/`);
  console.log(`[migrate-s3] dryRun=${dryRun} skipExisting=${skipExisting}`);

  const keys = await listAllKeys(client, source);
  console.log(`[migrate-s3] listed ${keys.length} object(s)`);

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;

  for (let i = 0; i < keys.length; i++) {
    const { key, size } = keys[i];
    if (skipExisting && (await headExists(client, dest, key))) {
      skipped++;
      continue;
    }
    if (dryRun) {
      console.log(`[migrate-s3] would copy ${key} (${size}B)`);
      copied++;
      bytes += size;
      continue;
    }
    try {
      await client.send(
        new CopyObjectCommand({
          Bucket: dest,
          Key: key,
          CopySource: encodeURIComponent(`${source}/${key}`),
          MetadataDirective: "COPY",
        }),
      );
      copied++;
      bytes += size;
      if ((i + 1) % 10 === 0 || i === keys.length - 1) {
        console.log(`[migrate-s3] progress ${i + 1}/${keys.length} copied=${copied} skipped=${skipped}`);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[migrate-s3] FAIL ${key}: ${msg}`);
    }
  }

  console.log(
    `[migrate-s3] done copied=${copied} skipped=${skipped} failed=${failed} bytes=${bytes}`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
