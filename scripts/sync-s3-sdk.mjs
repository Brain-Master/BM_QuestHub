#!/usr/bin/env node
/**
 * S3 sync via @aws-sdk/client-s3 (no AWS CLI required).
 * Same targets as sync-s3-public.mjs — invoked automatically as fallback.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

import { S3_YC_ENDPOINT, S3_YC_REGION } from "./lib/s3-storage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "apps", "web");
const DATA_DIR = path.join(WEB, "data");
const OFFERS_SNAPSHOT = path.join(DATA_DIR, "offers-snapshot.json");
const DATA_V2 = path.join(DATA_DIR, "v2");

const ENDPOINT = process.env.S3_ENDPOINT?.trim() || S3_YC_ENDPOINT;
const REGION = process.env.AWS_DEFAULT_REGION?.trim() || S3_YC_REGION;

const TARGETS = {
  "data-hot": {
    local: OFFERS_SNAPSHOT,
    key: "data/offers-snapshot.json",
    cacheControl: "public, max-age=60",
    validate: true,
    singleFile: true,
  },
  "data-cold": {
    local: DATA_V2,
    prefix: "data/v2/",
    cacheControl: "public, max-age=60",
    validate: true,
    delete: true,
  },
  data: {
    local: DATA_DIR,
    prefix: "data/",
    cacheControl: "public, max-age=60",
    validate: true,
    delete: true,
  },
  media: {
    local: process.env.S3_MEDIA_LOCAL_PATH?.trim() || path.join(WEB, "media"),
    prefix: "media/",
    cacheControl: "public, max-age=31536000, immutable",
    validate: false,
    optional: true,
    delete: true,
  },
  static: {
    local: path.join(WEB, "out"),
    prefix: "",
    cacheControl: "public, max-age=3600",
    validate: false,
    requiresBuild: true,
    delete: true,
  },
};

const ALL_TARGETS = ["data", "media", "static"];

const TARGET_HELP = "data-hot | data-cold | data | media | static | all";

function die(msg) {
  console.error(`[sync-s3-sdk] ${msg}`);
  process.exit(1);
}

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function validateSnapshots() {
  const validator = path.join(ROOT, "scripts", "validate-public-snapshot.mjs");
  const result = spawnSync(process.execPath, [validator], { stdio: "inherit", cwd: ROOT });
  if (result.status !== 0) die("validate-public-snapshot failed");
}

function resolveNames(targetArg) {
  if (targetArg === "all") return ALL_TARGETS;
  return targetArg.split(",").map((s) => s.trim());
}

async function listRemoteKeys(client, bucket, prefix) {
  const keys = new Set();
  let token;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: token,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.add(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function uploadSingleFile(client, bucket, name, config) {
  const local = config.local;
  if (!fs.existsSync(local)) {
    die(`missing ${path.relative(ROOT, local)}`);
  }

  const key = config.key;
  console.log(`[sync-s3-sdk] ${name}: ${local} -> s3://${bucket}/${key}`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.readFileSync(local),
      CacheControl: config.cacheControl,
      ContentType: contentType(local),
    }),
  );
}

async function syncDirectory(client, bucket, name, config) {
  const local = config.local;
  if (!fs.existsSync(local)) {
    if (config.optional) {
      console.warn(`[sync-s3-sdk] skip ${name}: missing ${path.relative(ROOT, local)}`);
      return;
    }
    if (config.requiresBuild) {
      die(`missing ${path.relative(ROOT, local)} — run npm run build in apps/web`);
    }
    die(`missing ${path.relative(ROOT, local)}`);
  }

  const prefix = config.prefix;
  const files = walkFiles(local);
  const uploaded = new Set();

  console.log(`[sync-s3-sdk] ${name}: ${local} -> s3://${bucket}/${prefix}`);

  for (const file of files) {
    const rel = path.relative(local, file).split(path.sep).join("/");
    const key = prefix ? `${prefix}${rel}` : rel;
    const body = fs.readFileSync(file);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        CacheControl: config.cacheControl,
        ContentType: contentType(file),
      }),
    );
    uploaded.add(key);
  }

  if (!config.delete) return;

  const remote = await listRemoteKeys(client, bucket, prefix);
  for (const key of remote) {
    if (!key.startsWith(prefix) && prefix) continue;
    if (!uploaded.has(key)) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
  }
}

async function syncTarget(client, bucket, name, config) {
  if (config.singleFile) {
    await uploadSingleFile(client, bucket, name, config);
    return;
  }
  await syncDirectory(client, bucket, name, config);
}

function contentType(file) {
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".html")) return "text/html";
  if (file.endsWith(".css")) return "text/css";
  if (file.endsWith(".js")) return "application/javascript";
  return "application/octet-stream";
}

export async function runS3SdkSync(targetArg = "all") {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) die("set S3_BUCKET");
  if (!process.env.AWS_ACCESS_KEY_ID?.trim() || !process.env.AWS_SECRET_ACCESS_KEY?.trim()) {
    die("set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
  }

  const client = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
    },
    forcePathStyle: true,
  });

  const names = resolveNames(targetArg);

  for (const name of names) {
    const config = TARGETS[name];
    if (!config) die(`unknown target "${name}"; use: ${TARGET_HELP}`);
    if (config.validate) validateSnapshots();
    await syncTarget(client, bucket, name, config);
  }
  console.log("[sync-s3-sdk] done");
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  runS3SdkSync(process.argv[2] || "all").catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
