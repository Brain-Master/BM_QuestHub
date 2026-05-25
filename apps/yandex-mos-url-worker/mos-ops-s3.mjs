import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { mosSyncDebug, mosSyncDebugWarn } from "./mos-sync-debug.mjs";
import { S3_YC_ENDPOINT, S3_YC_REGION } from "./s3-storage.mjs";

function s3TimeoutMs() {
  const n = Number(process.env.MOS_OPS_S3_TIMEOUT_MS || 10_000);
  return Number.isFinite(n) && n > 0 ? n : 10_000;
}

function mergeWriteAttempts() {
  const n = Number(process.env.MOS_OPS_S3_MERGE_WRITE_ATTEMPTS || 4);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

function mergeRounds() {
  const n = Number(process.env.MOS_OPS_S3_MERGE_ROUNDS || 6);
  return Number.isFinite(n) && n > 0 ? n : 6;
}

/**
 * @template T
 * @param {Promise<T>} promise
 */
export async function withS3Timeout(promise) {
  const ms = s3TimeoutMs();
  mosSyncDebug(`S3 op start (timeout ${ms}ms)`);
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("s3_timeout")), ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    mosSyncDebug("S3 op ok");
    return result;
  } finally {
    clearTimeout(timer);
    promise.catch(() => {});
  }
}

/**
 * @param {unknown} err
 */
export function formatS3Error(err) {
  if (err instanceof Error) return err.message || err.name || "s3_error";
  return String(err);
}

/**
 * @param {unknown} err
 */
export function isSoftS3Error(err) {
  const message = formatS3Error(err);
  if (message === "s3_timeout") return true;
  if (message === "UnknownError") return true;
  const name = /** @type {{ name?: string }} */ (err).name;
  if (name === "NoSuchKey" || name === "NotFound") return true;
  return /ECONNRESET|ETIMEDOUT|ENOTFOUND|socket|network/i.test(message);
}

export function createOpsS3() {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) return null;
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

/**
 * @param {string} key
 * @returns {Promise<{ data: unknown, etag: string | undefined, readOk: boolean }>}
 */
export async function readOpsJsonWithMeta(key) {
  const cfg = createOpsS3();
  if (!cfg) return { data: null, etag: undefined, readOk: false };
  mosSyncDebug(`readOpsJson ${key} bucket=${cfg.bucket}`);
  try {
    const res = await withS3Timeout(
      cfg.client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key })),
    );
    const raw = await res.Body?.transformToString("utf8");
    if (!raw?.trim()) return { data: null, etag: res.ETag, readOk: true };
    return { data: JSON.parse(raw), etag: res.ETag, readOk: true };
  } catch (err) {
    if (isSoftS3Error(err)) {
      console.warn(`[mos-ops-s3] readOpsJson ${key}: ${formatS3Error(err)}`);
      return { data: null, etag: undefined, readOk: false };
    }
    console.error(`[mos-ops-s3] readOpsJson ${key}:`, formatS3Error(err));
    return { data: null, etag: undefined, readOk: false };
  }
}

/**
 * @param {string} key
 * @returns {Promise<{ data: unknown, etag: string | undefined } | null>}
 */
export async function readOpsJson(key) {
  const stored = await readOpsJsonWithMeta(key);
  if (!stored.readOk) return null;
  return { data: stored.data, etag: stored.etag };
}

/**
 * @param {string} key
 * @param {unknown} data
 * @param {{ ifMatch?: string, maxAttempts?: number }} [opts]
 */
export async function writeOpsJson(key, data, opts = {}) {
  const cfg = createOpsS3();
  if (!cfg) return false;
  mosSyncDebug(`writeOpsJson ${key} bucket=${cfg.bucket}`);
  const maxAttempts = opts.maxAttempts ?? 4;
  let ifMatch = opts.ifMatch;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (ifMatch === undefined && attempt > 0) {
      const current = await readOpsJsonWithMeta(key);
      if (!current.readOk) {
        console.warn(`[mos-ops-s3] writeOpsJson ${key}: read failed on retry`);
        if (attempt === maxAttempts - 1) return false;
        continue;
      }
      ifMatch = current.etag;
    }
    try {
      /** @type {import("@aws-sdk/client-s3").PutObjectCommandInput} */
      const input = {
        Bucket: cfg.bucket,
        Key: key,
        Body: JSON.stringify(data, null, 2),
        ContentType: "application/json; charset=utf-8",
      };
      if (ifMatch) input.IfMatch = ifMatch;
      await withS3Timeout(cfg.client.send(new PutObjectCommand(input)));
      mosSyncDebug(`writeOpsJson ${key} ok`);
      return true;
    } catch (err) {
      const message = formatS3Error(err);
      const name = /** @type {{ name?: string }} */ (err).name;
      if (name === "PreconditionFailed" && attempt < maxAttempts - 1) {
        mosSyncDebugWarn(`writeOpsJson ${key} precondition retry`);
        const current = await readOpsJsonWithMeta(key);
        if (!current.readOk) continue;
        ifMatch = current.etag;
        continue;
      }
      console.warn(
        `[mos-ops-s3] writeOpsJson ${key} attempt ${attempt + 1}/${maxAttempts}: ${message}`,
      );
      if (attempt === maxAttempts - 1) return false;
    }
  }
  return false;
}

/**
 * @param {string} key
 * @param {string} body
 * @param {{ ifMatch?: string, maxAttempts?: number }} [opts]
 */
export async function writeOpsRaw(key, body, opts = {}) {
  const cfg = createOpsS3();
  if (!cfg) return false;
  const maxAttempts = opts.maxAttempts ?? 4;
  let ifMatch = opts.ifMatch;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (ifMatch === undefined && attempt > 0) {
      const current = await readOpsJsonWithMeta(key);
      if (!current.readOk) {
        if (attempt === maxAttempts - 1) return false;
        continue;
      }
      ifMatch = current.etag;
    }
    try {
      /** @type {import("@aws-sdk/client-s3").PutObjectCommandInput} */
      const input = {
        Bucket: cfg.bucket,
        Key: key,
        Body: body,
        ContentType: "text/plain; charset=utf-8",
      };
      if (ifMatch) input.IfMatch = ifMatch;
      await withS3Timeout(cfg.client.send(new PutObjectCommand(input)));
      return true;
    } catch (err) {
      const message = formatS3Error(err);
      const name = /** @type {{ name?: string }} */ (err).name;
      if (name === "PreconditionFailed" && attempt < maxAttempts - 1) {
        const current = await readOpsJsonWithMeta(key);
        if (!current.readOk) continue;
        ifMatch = current.etag;
        continue;
      }
      console.warn(
        `[mos-ops-s3] writeOpsRaw ${key} attempt ${attempt + 1}/${maxAttempts}: ${message}`,
      );
      if (attempt === maxAttempts - 1) return false;
    }
  }
  return false;
}

/**
 * @param {string} key
 * @returns {Promise<{ text: string, etag: string | undefined, readOk: boolean } | null>}
 */
export async function readOpsText(key) {
  const cfg = createOpsS3();
  if (!cfg) return null;
  try {
    const res = await withS3Timeout(
      cfg.client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key })),
    );
    const text = (await res.Body?.transformToString("utf8")) ?? "";
    return { text, etag: res.ETag, readOk: true };
  } catch (err) {
    if (isSoftS3Error(err)) {
      console.warn(`[mos-ops-s3] readOpsText ${key}: ${formatS3Error(err)}`);
      return { text: "", etag: undefined, readOk: false };
    }
    console.error(`[mos-ops-s3] readOpsText ${key}:`, formatS3Error(err));
    return null;
  }
}

/**
 * @param {string} key
 * @param {(current: unknown) => unknown} merge
 * @param {{ maxAttempts?: number }} [opts]
 * @returns {Promise<unknown | null>}
 */
export async function mergeOpsJson(key, merge, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? mergeRounds();
  const writeAttempts = mergeWriteAttempts();
  mosSyncDebug(`mergeOpsJson ${key} (max ${maxAttempts} rounds, write ${writeAttempts})`);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const current = await readOpsJsonWithMeta(key);
    if (!current.readOk) {
      mosSyncDebugWarn(`mergeOpsJson ${key} read failed (round ${attempt + 1})`);
      continue;
    }
    const next = merge(current.data ?? null);
    const ok = await writeOpsJson(key, next, {
      ifMatch: current.etag,
      maxAttempts: writeAttempts,
    });
    if (ok) {
      mosSyncDebug(`mergeOpsJson ${key} ok`);
      return next;
    }
    mosSyncDebugWarn(`mergeOpsJson ${key} attempt ${attempt + 1} failed`);
  }
  console.warn(`[mos-ops-s3] mergeOpsJson failed after ${maxAttempts} attempts: ${key}`);
  return null;
}
