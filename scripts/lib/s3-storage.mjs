/**
 * Central S3 storage profiles — switch buckets via env, not code edits.
 *
 * Active (hot):  S3_BUCKET, AWS_* , NEXT_PUBLIC_S3_PUBLIC_BASE_URL
 * Legacy (cold): S3_LEGACY_BUCKET (+ optional S3_LEGACY_* keys for read-only migrate)
 *
 * Profile switch: S3_STORAGE_PROFILE=hot|legacy (default hot)
 */

export const S3_ENDPOINT_DEFAULT = "https://s3.twcstorage.ru";
export const S3_REGION_DEFAULT = "ru-1";

/** @type {{ hot: { bucket: string, label: string }, legacy: { bucket: string, label: string } }} */
export const S3_STORAGE_DEFAULTS = {
  hot: {
    bucket: "bm-quest-s3-hot",
    label: "Timeweb Standard (hot)",
  },
  legacy: {
    bucket: "bm-questhub",
    label: "Timeweb cold (legacy)",
  },
};

/**
 * @returns {"hot" | "legacy"}
 */
export function activeS3ProfileName() {
  const p = process.env.S3_STORAGE_PROFILE?.trim().toLowerCase();
  return p === "legacy" ? "legacy" : "hot";
}

/**
 * @param {"hot" | "legacy"} [name]
 */
export function resolveS3Bucket(name = activeS3ProfileName()) {
  if (name === "legacy") {
    return (
      process.env.S3_LEGACY_BUCKET?.trim() ||
      S3_STORAGE_DEFAULTS.legacy.bucket
    );
  }
  return process.env.S3_BUCKET?.trim() || S3_STORAGE_DEFAULTS.hot.bucket;
}

/**
 * @param {"hot" | "legacy"} [name]
 */
export function publicBaseUrlForBucket(name = activeS3ProfileName()) {
  const explicit =
    name === "legacy"
      ? process.env.S3_LEGACY_PUBLIC_BASE_URL?.trim()
      : process.env.S3_PUBLIC_BASE_URL?.trim() ||
        process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const bucket = resolveS3Bucket(name);
  return `https://${bucket}.s3.twcstorage.ru`;
}

/**
 * Credentials for active profile (deploy, sync, YCF).
 */
export function activeS3Credentials() {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    endpoint: process.env.S3_ENDPOINT?.trim() || S3_ENDPOINT_DEFAULT,
    region: process.env.AWS_DEFAULT_REGION?.trim() || S3_REGION_DEFAULT,
    bucket: resolveS3Bucket("hot"),
    publicBaseUrl: publicBaseUrlForBucket("hot"),
  };
}

/**
 * Apply hot profile env vars (in-memory). Does not write files.
 * @param {{ accessKeyId: string, secretAccessKey: string, bucket?: string }} creds
 */
export function applyHotS3Env(creds) {
  process.env.S3_STORAGE_PROFILE = "hot";
  process.env.S3_BUCKET = creds.bucket || S3_STORAGE_DEFAULTS.hot.bucket;
  process.env.AWS_ACCESS_KEY_ID = creds.accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = creds.secretAccessKey;
  process.env.S3_ENDPOINT = process.env.S3_ENDPOINT?.trim() || S3_ENDPOINT_DEFAULT;
  process.env.AWS_DEFAULT_REGION =
    process.env.AWS_DEFAULT_REGION?.trim() || S3_REGION_DEFAULT;
  const base = publicBaseUrlForBucket("hot");
  process.env.S3_PUBLIC_BASE_URL = base;
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = base;
  process.env.S3_LEGACY_BUCKET =
    process.env.S3_LEGACY_BUCKET?.trim() || S3_STORAGE_DEFAULTS.legacy.bucket;
}
