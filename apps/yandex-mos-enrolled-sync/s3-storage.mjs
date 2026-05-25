/**
 * Central S3 storage profiles — switch buckets via env, not code edits.
 *
 * Active (hot):  Yandex Object Storage bm-questhub
 * Legacy:        Timeweb bm-quest-s3-hot (rollback / cross-migrate source)
 *
 * Profile switch: S3_STORAGE_PROFILE=hot|legacy (default hot)
 */

export const S3_YC_ENDPOINT = "https://storage.yandexcloud.net";
export const S3_YC_REGION = "ru-central1";

export const S3_TIMEWEB_ENDPOINT = "https://s3.twcstorage.ru";
export const S3_TIMEWEB_REGION = "ru-1";
/** Timeweb cold bucket — YCF deployment zips only (rollback path). */
export const S3_TIMEWEB_YCF_PACKAGE_BUCKET = "bm-questhub";

/** @deprecated use profile-specific endpoint via resolveS3Endpoint() */
export const S3_ENDPOINT_DEFAULT = S3_YC_ENDPOINT;
/** @deprecated use profile-specific region via resolveS3Region() */
export const S3_REGION_DEFAULT = S3_YC_REGION;

/** @type {{ hot: { bucket: string, label: string, provider: string }, legacy: { bucket: string, label: string, provider: string } }} */
export const S3_STORAGE_DEFAULTS = {
  hot: {
    bucket: "bm-questhub",
    label: "Yandex Object Storage (active)",
    provider: "yc",
  },
  legacy: {
    bucket: "bm-quest-s3-hot",
    label: "Timeweb hot (legacy rollback)",
    provider: "timeweb",
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
export function resolveS3Endpoint(name = activeS3ProfileName()) {
  if (name === "legacy") {
    return (
      process.env.S3_LEGACY_ENDPOINT?.trim() ||
      S3_TIMEWEB_ENDPOINT
    );
  }
  return process.env.S3_ENDPOINT?.trim() || S3_YC_ENDPOINT;
}

/**
 * @param {"hot" | "legacy"} [name]
 */
export function resolveS3Region(name = activeS3ProfileName()) {
  if (name === "legacy") {
    return (
      process.env.S3_LEGACY_REGION?.trim() ||
      S3_TIMEWEB_REGION
    );
  }
  return process.env.AWS_DEFAULT_REGION?.trim() || S3_YC_REGION;
}

/**
 * @param {string} endpoint
 * @param {string} bucket
 */
export function publicBaseUrlFromEndpoint(endpoint, bucket) {
  const e = endpoint.trim().toLowerCase();
  if (e.includes("yandexcloud.net")) {
    return `https://storage.yandexcloud.net/${bucket}`;
  }
  return `https://${bucket}.s3.twcstorage.ru`;
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
  return publicBaseUrlFromEndpoint(resolveS3Endpoint(name), bucket);
}

/**
 * Credentials for active profile (deploy, sync, YCF).
 */
export function activeS3Credentials() {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    endpoint: resolveS3Endpoint("hot"),
    region: resolveS3Region("hot"),
    bucket: resolveS3Bucket("hot"),
    publicBaseUrl: publicBaseUrlForBucket("hot"),
  };
}

/**
 * Apply hot (YC) profile env vars (in-memory). Does not write files.
 * @param {{ accessKeyId: string, secretAccessKey: string, bucket?: string, endpoint?: string, region?: string }} creds
 */
export function applyHotS3Env(creds) {
  process.env.S3_STORAGE_PROFILE = "hot";
  process.env.S3_BUCKET = creds.bucket || S3_STORAGE_DEFAULTS.hot.bucket;
  process.env.AWS_ACCESS_KEY_ID = creds.accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = creds.secretAccessKey;
  process.env.S3_ENDPOINT = creds.endpoint?.trim() || S3_YC_ENDPOINT;
  process.env.AWS_DEFAULT_REGION = creds.region?.trim() || S3_YC_REGION;
  const base = publicBaseUrlForBucket("hot");
  process.env.S3_PUBLIC_BASE_URL = base;
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = base;
  process.env.S3_LEGACY_BUCKET =
    process.env.S3_LEGACY_BUCKET?.trim() || S3_STORAGE_DEFAULTS.legacy.bucket;
  process.env.S3_LEGACY_ENDPOINT =
    process.env.S3_LEGACY_ENDPOINT?.trim() || S3_TIMEWEB_ENDPOINT;
  process.env.S3_LEGACY_PUBLIC_BASE_URL =
    process.env.S3_LEGACY_PUBLIC_BASE_URL?.trim() ||
    publicBaseUrlFromEndpoint(S3_TIMEWEB_ENDPOINT, S3_STORAGE_DEFAULTS.legacy.bucket);
}
