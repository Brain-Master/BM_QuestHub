#!/usr/bin/env node
/**
 * Copy objects across S3 providers (Timeweb → Yandex Cloud) via GetObject + PutObject.
 *
 *   node scripts/migrate-s3-cross.mjs --dry-run
 *   node scripts/migrate-s3-cross.mjs
 *
 * Defaults: source Timeweb bm-quest-s3-hot (secret/bm-questhub-s3-hot.txt),
 *           dest YC bm-questhub (secret/bm-questhub-s3-yc.txt or active s3.env).
 */
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";

import { loadRepoEnv, loadS3Env } from "./load-dotenv.mjs";
import { parseTimewebS3SecretFile } from "./lib/parse-timeweb-s3-secret.mjs";
import {
  S3_STORAGE_DEFAULTS,
  S3_TIMEWEB_ENDPOINT,
  S3_TIMEWEB_REGION,
  S3_YC_ENDPOINT,
  S3_YC_REGION,
} from "./lib/s3-storage.mjs";

const ROOT = loadRepoEnv();

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1]?.trim() || fallback : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

/**
 * @param {string} filePath
 */
function loadCredsFromSecret(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`secret not found: ${filePath}`);
  }
  return parseTimewebS3SecretFile(filePath);
}

/**
 * @param {{ endpoint: string, region: string, accessKeyId: string, secretAccessKey: string }} cfg
 */
function createClient(cfg) {
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

/**
 * @param {S3Client} client
 * @param {string} bucket
 */
async function listAllKeys(client, bucket) {
  /** @type {{ key: string, size: number }[]} */
  const keys = [];
  let token;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
      }),
    );
    for (const o of res.Contents || []) {
      if (!o.Key || o.Key.endsWith("/")) continue;
      keys.push({ key: o.Key, size: o.Size ?? 0 });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
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

/**
 * @param {S3Client} sourceClient
 * @param {string} sourceBucket
 * @param {S3Client} destClient
 * @param {string} destBucket
 * @param {string} key
 */
async function copyOne(sourceClient, sourceBucket, destClient, destBucket, key) {
  const res = await sourceClient.send(
    new GetObjectCommand({ Bucket: sourceBucket, Key: key }),
  );
  const body = await res.Body?.transformToByteArray();
  if (!body) throw new Error("empty body");
  await destClient.send(
    new PutObjectCommand({
      Bucket: destBucket,
      Key: key,
      Body: body,
      ContentType: res.ContentType || guessContentType(key),
    }),
  );
}

/**
 * @param {string} key
 */
function guessContentType(key) {
  if (key.endsWith(".json")) return "application/json; charset=utf-8";
  if (key.endsWith(".jsonl")) return "application/x-ndjson; charset=utf-8";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".mp4")) return "video/mp4";
  if (key.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (key.endsWith(".css")) return "text/css; charset=utf-8";
  if (key.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

function resolveSourceCreds() {
  const hotSecret = path.join(ROOT, "secret", "bm-questhub-s3-hot.txt");
  const parsed = loadCredsFromSecret(hotSecret);
  return {
    accessKeyId: parsed.accessKeyId,
    secretAccessKey: parsed.secretAccessKey,
  };
}

function resolveDestCreds() {
  if (process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim()) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
    };
  }
  for (const name of ["bm-questhub-s3-yc.txt", "bm-questhub-s3.txt"]) {
    const p = path.join(ROOT, "secret", name);
    if (fs.existsSync(p)) {
      const parsed = loadCredsFromSecret(p);
      return {
        accessKeyId: parsed.accessKeyId,
        secretAccessKey: parsed.secretAccessKey,
      };
    }
  }
  throw new Error("dest credentials: run make setup-s3-yc-env or set AWS_* in scripts/s3.env");
}

async function main() {
  loadS3Env();
  loadRepoEnv();

  const sourceBucket =
    arg("--source-bucket", S3_STORAGE_DEFAULTS.legacy.bucket);
  const destBucket = arg("--dest-bucket", S3_STORAGE_DEFAULTS.hot.bucket);
  const sourceEndpoint = arg("--source-endpoint", S3_TIMEWEB_ENDPOINT);
  const destEndpoint = arg("--dest-endpoint", S3_YC_ENDPOINT);
  const dryRun = hasFlag("--dry-run");
  const skipExisting = !hasFlag("--force");

  const sourceClient = createClient({
    endpoint: sourceEndpoint,
    region: arg("--source-region", S3_TIMEWEB_REGION),
    ...resolveSourceCreds(),
  });
  const destClient = createClient({
    endpoint: destEndpoint,
    region: arg("--dest-region", S3_YC_REGION),
    ...resolveDestCreds(),
  });

  console.log(
    `[migrate-cross] ${sourceEndpoint}/${sourceBucket} → ${destEndpoint}/${destBucket}`,
  );
  console.log(`[migrate-cross] dryRun=${dryRun} skipExisting=${skipExisting}`);

  const keys = await listAllKeys(sourceClient, sourceBucket);
  console.log(`[migrate-cross] listed ${keys.length} object(s) from source`);

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;

  for (let i = 0; i < keys.length; i++) {
    const { key, size } = keys[i];
    if (skipExisting && (await headExists(destClient, destBucket, key))) {
      skipped++;
      continue;
    }
    if (dryRun) {
      console.log(`[migrate-cross] would copy ${key} (${size}B)`);
      copied++;
      bytes += size;
      continue;
    }
    try {
      await copyOne(sourceClient, sourceBucket, destClient, destBucket, key);
      copied++;
      bytes += size;
      if ((i + 1) % 10 === 0 || i === keys.length - 1) {
        console.log(
          `[migrate-cross] progress ${i + 1}/${keys.length} copied=${copied} skipped=${skipped}`,
        );
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[migrate-cross] FAIL ${key}: ${msg}`);
    }
  }

  console.log(
    `[migrate-cross] done copied=${copied} skipped=${skipped} failed=${failed} bytes=${bytes}`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
