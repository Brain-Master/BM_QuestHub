#!/usr/bin/env node
/**
 * Push local data/offers-snapshot.json to legacy Timeweb bucket (production browser URL).
 * Use when Timeweb App still has NEXT_PUBLIC_S3_PUBLIC_BASE_URL=*.twcstorage.ru.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { loadRepoEnv } from "./load-dotenv.mjs";
import { parseTimewebS3SecretFile } from "./lib/parse-timeweb-s3-secret.mjs";
import { S3_TIMEWEB_ENDPOINT, S3_TIMEWEB_REGION } from "./lib/s3-storage.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = path.join(ROOT, "apps", "web", "data", "offers-snapshot.json");
const KEY = "data/offers-snapshot.json";
const BUCKET = process.env.TIMEWEB_SNAPSHOT_BUCKET?.trim() || "bm-questhub";

function resolveSecretPath() {
  const candidates = [
    path.join(ROOT, "secret", "bm-questhub-s3-hot.txt"),
    path.join(ROOT, "secret", "bm-questhub-s3.txt"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Timeweb S3 secret not found (secret/bm-questhub-s3-hot.txt)");
}

async function main() {
  if (!fs.existsSync(SNAPSHOT)) {
    throw new Error(`missing ${SNAPSHOT} — run make publish-sheet-hot first`);
  }
  const body = fs.readFileSync(SNAPSHOT);
  const parsed = JSON.parse(body.toString("utf8"));
  const creds = parseTimewebS3SecretFile(resolveSecretPath());
  const client = new S3Client({
    region: S3_TIMEWEB_REGION,
    endpoint: S3_TIMEWEB_ENDPOINT,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      Body: body,
      ContentType: "application/json; charset=utf-8",
      CacheControl: "public, max-age=60",
    }),
  );

  console.log(
    `[sync-timeweb] ok ${BUCKET}/${KEY} generatedAt=${parsed.generatedAt ?? "?"}`,
  );
  console.log(
    `[sync-timeweb] public URL: https://${BUCKET}.s3.twcstorage.ru/${KEY}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
