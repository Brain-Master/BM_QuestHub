import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { performance } from "node:perf_hooks";
import { hostname } from "node:os";

import {
  createOpsS3,
  formatS3Error,
  readOpsJson,
  readOpsJsonWithMeta,
  withS3Timeout,
} from "./mos-ops-s3.mjs";
import {
  publicBaseUrlForBucket,
  resolveS3Bucket,
  S3_YC_ENDPOINT,
  S3_YC_REGION,
} from "./s3-storage.mjs";
import { sendTelegramAlert } from "./telegram-alert.mjs";

const DEFAULT_KEYS = [
  { key: "ops/mos-enrolled-snapshot.json", label: "ops snapshot" },
  { key: "ops/mos-sync-state.json", label: "ops sync state" },
  { key: "ops/schedule-traffic.json", label: "ops traffic" },
  { key: "data/v2/site-config.json", label: "data site-config" },
];

/**
 * @param {number[]} ms
 */
function timingStats(ms) {
  if (!ms.length) return { n: 0, min: 0, p50: 0, p95: 0, max: 0, avg: 0 };
  const sorted = [...ms].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  return {
    n: sorted.length,
    min: sorted[0],
    p50: p(0.5),
    p95: p(0.95),
    max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length),
  };
}

/**
 * @param {ReturnType<typeof timingStats>} s
 */
function fmtStats(s) {
  if (!s.n) return "no samples";
  return `n=${s.n} min=${s.min} p50=${s.p50} p95=${s.p95} max=${s.max} avg=${s.avg}ms`;
}

/**
 * @param {(msg: string) => void} log
 */
function createApiClient(log) {
  const cfg = createOpsS3();
  if (!cfg) {
    log("ERROR S3 client: missing S3_BUCKET or AWS keys");
    return null;
  }
  log(
    `config bucket=${cfg.bucket} endpoint=${process.env.S3_ENDPOINT?.trim() || S3_YC_ENDPOINT} region=${process.env.AWS_DEFAULT_REGION?.trim() || S3_YC_REGION}`,
  );
  log(`config MOS_OPS_S3_TIMEOUT_MS=${process.env.MOS_OPS_S3_TIMEOUT_MS?.trim() || "10000 (default)"}`);
  return cfg;
}

/**
 * @param {import("@aws-sdk/client-s3").S3Client} client
 * @param {string} bucket
 * @param {string} key
 * @param {number} rounds
 * @param {(msg: string) => void} log
 */
async function probeApiGet(client, bucket, key, rounds, log) {
  const ms = [];
  let lastError = null;
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    try {
      const res = await withS3Timeout(
        client.send(new GetObjectCommand({ Bucket: bucket, Key: key })),
      );
      const body = await res.Body?.transformToByteArray();
      const elapsed = Math.round(performance.now() - t0);
      ms.push(elapsed);
      if (i === 0) {
        log(
          `  GET ${key}: ok ${elapsed}ms size=${body?.length ?? 0}B etag=${res.ETag ?? "—"}`,
        );
      }
    } catch (err) {
      lastError = formatS3Error(err);
      ms.push(Math.round(performance.now() - t0));
      log(`  GET ${key} attempt ${i + 1}: FAIL ${lastError} (${ms[ms.length - 1]}ms)`);
    }
  }
  const s = timingStats(ms);
  return { ok: !lastError, key, ms, stats: s, error: lastError };
}

/**
 * @param {import("@aws-sdk/client-s3").S3Client} client
 * @param {string} bucket
 * @param {(msg: string) => void} log
 */
async function probeApiPut(client, bucket, log) {
  const key = `ops/_s3-probe-ycf-${Date.now()}.json`;
  const body = JSON.stringify({
    probe: true,
    host: hostname(),
    at: new Date().toISOString(),
  });
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
    const ms = Math.round(performance.now() - t0);
    log(`  PUT ${key}: ok ${ms}ms (${body.length}B)`);
    return { ok: true, key, ms };
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    const msg = formatS3Error(err);
    log(`  PUT ${key}: FAIL ${msg} (${ms}ms)`);
    return { ok: false, key, ms, error: msg };
  }
}

/**
 * @param {string} publicUrl
 * @param {number} rounds
 * @param {(msg: string) => void} log
 */
async function probePublicGet(publicUrl, rounds, log) {
  const ms = [];
  let lastError = null;
  let status = 0;
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(publicUrl, { method: "GET", cache: "no-store" });
      status = res.status;
      await res.arrayBuffer();
      if (!res.ok) lastError = `HTTP ${res.status}`;
      ms.push(Math.round(performance.now() - t0));
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      ms.push(Math.round(performance.now() - t0));
    }
  }
  if (lastError) log(`  public ${publicUrl}: FAIL ${lastError} (last status ${status})`);
  else log(`  public ${publicUrl}: ok HTTP ${status}`);
  return { ok: !lastError, url: publicUrl, stats: timingStats(ms), error: lastError };
}

/**
 * @param {(msg: string) => void} log
 * @param {number} rounds
 */
async function probeReadOpsJson(log, rounds) {
  const key = "ops/mos-enrolled-snapshot.json";
  const ms = [];
  let lastError = null;
  let readFailed = false;
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    try {
      const stored = await readOpsJsonWithMeta(key);
      ms.push(Math.round(performance.now() - t0));
      if (!stored.readOk) {
        readFailed = true;
        lastError = "readOk=false";
      }
    } catch (err) {
      lastError = formatS3Error(err);
      readFailed = true;
      ms.push(Math.round(performance.now() - t0));
    }
  }
  const s = timingStats(ms);
  const slowMs = Number(process.env.S3_PROBE_READOPS_SLOW_MS || 10_000);
  const timedOut = ms.some((n) => n >= Number(process.env.MOS_OPS_S3_TIMEOUT_MS || 15_000) - 500);
  const ok = !lastError && !readFailed && !timedOut && s.p50 < slowMs;
  log(
    `  readOpsJson(${key}): ${ok ? "ok" : "FAIL"} ${fmtStats(s)}${timedOut ? " (hit S3 timeout)" : ""}`,
  );
  return { ok, stats: s, error: lastError || (timedOut ? "s3_timeout" : null) };
}

/**
 * @param {import("@aws-sdk/client-s3").S3Client} client
 * @param {string} bucket
 * @param {(msg: string) => void} log
 */
async function probeParallelBurst(client, bucket, log) {
  const keys = ["ops/mos-sync-state.json", "ops/mos-enrolled-snapshot.json", "ops/schedule-traffic.json"];
  const t0 = performance.now();
  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        await withS3Timeout(
          client.send(new GetObjectCommand({ Bucket: bucket, Key: key })),
        );
        return { key, ok: true };
      } catch (err) {
        return { key, ok: false, error: formatS3Error(err) };
      }
    }),
  );
  const elapsed = Math.round(performance.now() - t0);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    for (const f of failed) log(`  parallel FAIL ${f.key}: ${f.error}`);
    log(`  parallel 3×GET: FAIL wall=${elapsed}ms`);
    return { ok: false, elapsed, failed };
  }
  log(`  parallel 3×GET: ok wall=${elapsed}ms`);
  return { ok: true, elapsed };
}

/**
 * @param {import("@aws-sdk/client-s3").S3Client} client
 * @param {string} bucket
 * @param {(msg: string) => void} log
 */
async function probeSequentialMerge(client, bucket, log) {
  const t0 = performance.now();
  let err = null;
  try {
    await withS3Timeout(
      client.send(
        new GetObjectCommand({ Bucket: bucket, Key: "ops/mos-sync-state.json" }),
      ),
    );
    await withS3Timeout(
      client.send(
        new GetObjectCommand({ Bucket: bucket, Key: "ops/mos-enrolled-snapshot.json" }),
      ),
    );
  } catch (e) {
    err = formatS3Error(e);
  }
  const elapsed = Math.round(performance.now() - t0);
  if (err) {
    log(`  sequential state→snapshot: FAIL ${err} (${elapsed}ms)`);
    return { ok: false, elapsed, error: err };
  }
  log(`  sequential state→snapshot: ok ${elapsed}ms`);
  return { ok: true, elapsed };
}

/**
 * @param {{ rounds?: number, sendTelegram?: boolean, source?: string }} [opts]
 */
export async function runS3ConnectivityProbe(opts = {}) {
  const rounds = Math.max(1, Number(process.env.S3_PROBE_ROUNDS || opts.rounds || 3));
  const sendTg = opts.sendTelegram !== false && process.env.S3_PROBE_TG?.trim() !== "0";
  const source = opts.source?.trim() || "ycf";
  const bucket = resolveS3Bucket("hot");
  const publicBase =
    process.env.S3_PUBLIC_BASE_URL?.trim() || publicBaseUrlForBucket("hot");

  /** @type {string[]} */
  const lines = [];
  const log = (msg) => {
    const line = `[s3-probe] ${msg}`;
    console.log(line);
    lines.push(msg);
  };

  const startedAt = new Date().toISOString();
  log(`start source=${source} host=${hostname()} at=${startedAt}`);
  log(`rounds=${rounds}`);

  const cfg = createApiClient(log);
  if (!cfg) {
    const summary = { ok: false, error: "s3_not_configured" };
    if (sendTg) await sendProbeTelegram({ summary, lines, startedAt, bucket, source });
    return { ok: false, lines, summary };
  }

  /** @type {Array<{ label: string, ok: boolean, detail: string }>} */
  const sections = [];

  for (const { key, label } of DEFAULT_KEYS) {
    log(`--- API GetObject: ${label} ---`);
    const r = await probeApiGet(cfg.client, cfg.bucket, key, rounds, log);
    sections.push({
      label: `GET ${label}`,
      ok: r.ok,
      detail: r.ok ? fmtStats(r.stats) : String(r.error),
    });
  }

  log("--- API PutObject probe ---");
  const put = await probeApiPut(cfg.client, cfg.bucket, log);
  sections.push({
    label: "PUT probe",
    ok: put.ok,
    detail: put.ok ? `${put.ms}ms` : String(put.error),
  });

  log("--- readOpsJson (sync wrapper) ---");
  const ro = await probeReadOpsJson(log, rounds);
  sections.push({
    label: "readOpsJson snapshot",
    ok: ro.ok,
    detail: ro.ok ? fmtStats(ro.stats) : String(ro.error),
  });

  log("--- parallel burst ---");
  const par = await probeParallelBurst(cfg.client, cfg.bucket, log);
  sections.push({
    label: "parallel 3×GET",
    ok: par.ok,
    detail: par.ok ? `${par.elapsed}ms` : `${par.failed?.length ?? 0} failed`,
  });

  log("--- sequential (merge-like) ---");
  const seq = await probeSequentialMerge(cfg.client, cfg.bucket, log);
  sections.push({
    label: "sequential state→snapshot",
    ok: seq.ok,
    detail: seq.ok ? `${seq.elapsed}ms` : String(seq.error),
  });

  log("--- public GET from YCF ---");
  for (const { key, label } of DEFAULT_KEYS.slice(0, 2)) {
    const url = `${publicBase.replace(/\/$/, "")}/${key}`;
    const r = await probePublicGet(url, Math.min(2, rounds), log);
    sections.push({
      label: `public ${label}`,
      ok: r.ok,
      detail: r.ok ? fmtStats(r.stats) : String(r.error),
    });
  }

  const failCount = sections.filter((s) => !s.ok).length;
  const ok = failCount === 0;
  const elapsedMs = Date.now() - Date.parse(startedAt);
  log(`done ok=${ok} failures=${failCount} elapsed=${elapsedMs}ms`);

  const summary = { ok, failCount, elapsedMs, sections, startedAt, bucket, source };
  if (sendTg) await sendProbeTelegram({ summary, lines, startedAt, bucket, source });

  return { ok, lines, summary };
}

/**
 * @param {{ summary: { ok: boolean, failCount?: number, sections?: { label: string, ok: boolean, detail: string }[], elapsedMs?: number, error?: string }, lines: string[], startedAt: string, bucket: string, source: string }} payload
 */
async function sendProbeTelegram(payload) {
  const { summary, lines, startedAt, bucket, source } = payload;
  const icon = summary.ok ? "✅" : "⚠️";
  const tgLines = [
    `${icon} Quest Hub · S3 probe (YCF)`,
    "",
    `Источник: ${source}`,
    `Бакет: ${bucket}`,
    `Старт: ${startedAt}`,
    `Итог: ${summary.ok ? "OK" : `FAIL (${summary.failCount ?? "?"} checks)`}`,
  ];
  if (summary.elapsedMs != null) tgLines.push(`Длительность: ${summary.elapsedMs}ms`);
  if (summary.error) tgLines.push(`Ошибка: ${summary.error}`);

  if (summary.sections?.length) {
    tgLines.push("", "Проверки:");
    for (const s of summary.sections) {
      tgLines.push(`${s.ok ? "✓" : "✗"} ${s.label}: ${s.detail}`);
    }
  }

  const tail = lines.slice(-12);
  if (tail.length) {
    tgLines.push("", "Последние логи:", ...tail.map((l) => l.slice(0, 200)));
  }
  tgLines.push("", "Полный лог: YCF bm-s3-connectivity-probe");

  await sendTelegramAlert(tgLines.join("\n"));
}
