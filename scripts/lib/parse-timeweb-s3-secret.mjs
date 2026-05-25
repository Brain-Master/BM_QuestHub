import fs from "node:fs";

/** @typedef {{ accessKeyId: string, secretAccessKey: string, bucket?: string, swiftUrl?: string }} TimewebS3Secret */

/**
 * Parse Timeweb dashboard export (secret/bm-questhub-s3-hot.txt style).
 * @param {string} filePath
 * @returns {TimewebS3Secret}
 */
export function parseTimewebS3SecretFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  /** @type {Record<string, string>} */
  const kv = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    kv[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  const accessKeyId =
    kv["S3 Access Key"]?.trim() ||
    kv.AWS_ACCESS_KEY_ID?.trim() ||
    kv.S3_ACCESS_KEY?.trim();
  const secretAccessKey =
    kv["S3 Secret Access Key"]?.trim() ||
    kv.AWS_SECRET_ACCESS_KEY?.trim() ||
    kv.S3_SECRET_ACCESS_KEY?.trim();

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(`missing S3 keys in ${filePath}`);
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucket: kv.S3_BUCKET?.trim() || kv.Bucket?.trim() || undefined,
    swiftUrl: kv["Swift URL"]?.trim(),
  };
}
