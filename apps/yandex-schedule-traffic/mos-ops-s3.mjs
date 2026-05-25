import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * @returns {{ client: S3Client, bucket: string } | null}
 */
function s3TimeoutMs() {
  const n = Number(process.env.MOS_OPS_S3_TIMEOUT_MS || 10_000);
  return Number.isFinite(n) && n > 0 ? n : 10_000;
}

/**
 * @template T
 * @param {Promise<T>} promise
 */
async function withS3Timeout(promise) {
  const ms = s3TimeoutMs();
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("s3_timeout")), ms);
    }),
  ]);
}

export function createOpsS3() {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) return null;
  const client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION?.trim() || "ru-1",
    endpoint: process.env.S3_ENDPOINT?.trim() || "https://s3.twcstorage.ru",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    },
  });
  return { client, bucket };
}

/**
 * @param {string} key
 * @returns {Promise<{ data: unknown, etag: string | undefined } | null>}
 */
export async function readOpsJson(key) {
  const cfg = createOpsS3();
  if (!cfg) return null;
  try {
    const res = await withS3Timeout(
      cfg.client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key })),
    );
    const raw = await res.Body?.transformToString("utf8");
    if (!raw?.trim()) return { data: null, etag: res.ETag };
    return { data: JSON.parse(raw), etag: res.ETag };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "s3_timeout") return null;
    const name = /** @type {{ name?: string }} */ (err).name;
    if (name === "NoSuchKey" || name === "NotFound") return { data: null, etag: undefined };
    throw err;
  }
}

/**
 * @param {string} key
 * @param {unknown} data
 * @param {{ ifMatch?: string, maxAttempts?: number }} [opts]
 */
export async function writeOpsJson(key, data, opts = {}) {
  const cfg = createOpsS3();
  if (!cfg) return false;
  const maxAttempts = opts.maxAttempts ?? 4;
  let ifMatch = opts.ifMatch;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (ifMatch === undefined && attempt > 0) {
      const current = await readOpsJson(key);
      ifMatch = current?.etag;
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
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "s3_timeout") throw err;
      const name = /** @type {{ name?: string }} */ (err).name;
      if (name === "PreconditionFailed" && attempt < maxAttempts - 1) {
        const current = await readOpsJson(key);
        ifMatch = current?.etag;
        continue;
      }
      throw err;
    }
  }
  return false;
}

/**
 * @param {string} key
 * @param {(current: unknown) => unknown} merge
 * @param {{ maxAttempts?: number }} [opts]
 */
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
      const current = await readOpsJson(key);
      ifMatch = current?.etag;
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
      const message = err instanceof Error ? err.message : String(err);
      if (message === "s3_timeout") throw err;
      const name = /** @type {{ name?: string }} */ (err).name;
      if (name === "PreconditionFailed" && attempt < maxAttempts - 1) {
        const current = await readOpsJson(key);
        ifMatch = current?.etag;
        continue;
      }
      throw err;
    }
  }
  return false;
}

/**
 * @param {string} key
 * @returns {Promise<{ text: string, etag: string | undefined } | null>}
 */
export async function readOpsText(key) {
  const cfg = createOpsS3();
  if (!cfg) return null;
  try {
    const res = await withS3Timeout(
      cfg.client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key })),
    );
    const text = (await res.Body?.transformToString("utf8")) ?? "";
    return { text, etag: res.ETag };
  } catch (err) {
    const name = /** @type {{ name?: string }} */ (err).name;
    if (name === "NoSuchKey" || name === "NotFound") return { text: "", etag: undefined };
    throw err;
  }
}

export async function mergeOpsJson(key, merge, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 6;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const current = await readOpsJson(key);
    const next = merge(current?.data ?? null);
    const ok = await writeOpsJson(key, next, {
      ifMatch: current?.etag,
      maxAttempts: 1,
    });
    if (ok) return next;
  }
  throw new Error(`mergeOpsJson failed after ${maxAttempts} attempts: ${key}`);
}
