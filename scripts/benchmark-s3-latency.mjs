#!/usr/bin/env node
/**
 * Measure S3 latency: public GET (curl-like) vs S3 API (same path as YCF mos-ops-s3).
 * Usage: node scripts/benchmark-s3-latency.mjs [--rounds=5]
 * Requires scripts/s3.env for API benchmarks (optional).
 */
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv } from "./load-dotenv.mjs";
import { readOpsJson, withS3Timeout } from "./lib/mos-ops-s3.mjs";
import {
  publicBaseUrlForBucket,
  resolveS3Bucket,
  S3_YC_ENDPOINT,
  S3_YC_REGION,
} from "./lib/s3-storage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BUCKET = resolveS3Bucket("hot");
const PUBLIC_BASE = publicBaseUrlForBucket("hot");

const KEYS = [
  { key: "ops/mos-enrolled-snapshot.json", label: "ops snapshot" },
  { key: "ops/mos-sync-state.json", label: "ops sync state" },
  { key: "ops/schedule-traffic.json", label: "ops traffic" },
  { key: "data/v2/site-config.json", label: "data site-config" },
  { key: "data/offers-snapshot.json", label: "data offers" },
];

const rounds = Math.max(1, Number(process.argv.find((a) => a.startsWith("--rounds="))?.split("=")[1] || 5));

function stats(msList) {
  const sorted = [...msList].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  return {
    n: sorted.length,
    min: sorted[0] ?? 0,
    p50: p(0.5),
    p95: p(0.95),
    max: sorted[sorted.length - 1] ?? 0,
    avg: sorted.length ? Math.round(sum / sorted.length) : 0,
  };
}

function fmtStats(s) {
  return `n=${s.n} min=${s.min}ms p50=${s.p50}ms p95=${s.p95}ms max=${s.max}ms avg=${s.avg}ms`;
}

async function benchPublicGet(key, n) {
  const url = `${PUBLIC_BASE}/${key}`;
  const ms = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    await res.arrayBuffer();
    ms.push(Math.round(performance.now() - t0));
    if (!res.ok) {
      return { error: `HTTP ${res.status}`, ms };
    }
  }
  return { ms };
}

function createApiClient() {
  const bucket = process.env.S3_BUCKET?.trim() || BUCKET;
  const client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION?.trim() || S3_YC_REGION,
    endpoint: process.env.S3_ENDPOINT?.trim() || S3_YC_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    },
  });
  return { client, bucket };
}

async function benchApiGet(client, bucket, key, n) {
  const ms = [];
  const timeoutMs = Number(process.env.MOS_OPS_S3_TIMEOUT_MS || 15_000);
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    try {
      await withS3Timeout(
        client.send(new GetObjectCommand({ Bucket: bucket, Key: key })),
      );
      ms.push(Math.round(performance.now() - t0));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: msg, ms, timeoutMs };
    }
  }
  return { ms, timeoutMs };
}

async function benchApiPutProbe(client, bucket) {
  const key = `ops/_benchmark-probe-${Date.now()}.json`;
  const body = JSON.stringify({ probe: true, at: new Date().toISOString() });
  const timeoutMs = Number(process.env.MOS_OPS_S3_TIMEOUT_MS || 15_000);
  const t0 = performance.now();
  try {
    await withS3Timeout(
      client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: "application/json; charset=utf-8",
        }),
      ),
    );
    return {
      key,
      ms: Math.round(performance.now() - t0),
      timeoutMs,
    };
  } catch (err) {
    return {
      key,
      error: err instanceof Error ? err.message : String(err),
      ms: Math.round(performance.now() - t0),
      timeoutMs,
    };
  }
}

async function benchReadOpsJson(key, n) {
  const ms = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    await readOpsJson(key);
    ms.push(Math.round(performance.now() - t0));
  }
  return { ms };
}

async function main() {
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  const hasApi =
    Boolean(process.env.AWS_ACCESS_KEY_ID?.trim()) &&
    Boolean(process.env.AWS_SECRET_ACCESS_KEY?.trim());

  console.log(`S3 benchmark — rounds=${rounds}, bucket=${process.env.S3_BUCKET?.trim() || BUCKET}`);
  console.log(`Endpoint: ${process.env.S3_ENDPOINT?.trim() || S3_YC_ENDPOINT}`);
  console.log(`MOS_OPS_S3_TIMEOUT_MS=${process.env.MOS_OPS_S3_TIMEOUT_MS || "(default 10000)"}`);
  console.log("");

  console.log("=== Public GET (fetch, как CDN/браузер) ===");
  for (const { key, label } of KEYS) {
    const r = await benchPublicGet(key, rounds);
    if (r.error) {
      console.log(`  ${label}: ERROR ${r.error}  ${fmtStats(stats(r.ms))}`);
    } else {
      console.log(`  ${label}: ${fmtStats(stats(r.ms))}`);
    }
  }

  if (!hasApi) {
    console.log("\n=== S3 API (GetObject, как YCF) ===");
    console.log("  SKIP — нет scripts/s3.env (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)");
    return;
  }

  const { client, bucket } = createApiClient();
  console.log("\n=== S3 API GetObject + withS3Timeout (как bm-mos-enrolled-sync) ===");
  for (const { key, label } of KEYS) {
    const r = await benchApiGet(client, bucket, key, rounds);
    if (r.error) {
      console.log(
        `  ${label}: ERROR ${r.error} (timeout ${r.timeoutMs}ms)  ${fmtStats(stats(r.ms))}`,
      );
    } else {
      console.log(`  ${label}: ${fmtStats(stats(r.ms))}  [race timeout ${r.timeoutMs}ms]`);
    }
  }

  console.log("\n=== readOpsJson() wrapper ===");
  for (const { key, label } of KEYS.slice(0, 3)) {
    const r = await benchReadOpsJson(key, rounds);
    console.log(`  ${label}: ${fmtStats(stats(r.ms))}`);
  }

  const put = await benchApiPutProbe(client, bucket);
  if (put.error) {
    console.log(`\n=== PutObject probe === ERROR ${put.error} after ${put.ms}ms (timeout ${put.timeoutMs}ms)`);
  } else {
    console.log(`\n=== PutObject probe === ${put.ms}ms → ${put.key} (timeout ${put.timeoutMs}ms)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
