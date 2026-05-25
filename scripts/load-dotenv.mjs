import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Load KEY=VALUE lines from a file into process.env.
 * @param {string} filePath
 * @param {{ override?: boolean }} [opts] When true, later file values replace existing keys.
 */
export function loadDotEnv(filePath, opts = {}) {
  if (!fs.existsSync(filePath)) return false;
  const override = opts.override === true;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
  return true;
}

/**
 * Load S3 env: hot profile file first, then active s3.env (see docs/deployment/s3-storage-migration.md).
 * @param {{ preferHot?: boolean }} [opts]
 */
export function loadS3Env(opts = {}) {
  const preferHot =
    opts.preferHot !== false &&
    (process.env.S3_USE_HOT?.trim() === "1" ||
      process.env.S3_STORAGE_PROFILE?.trim().toLowerCase() !== "legacy");
  if (preferHot) {
    loadDotEnv(path.join(ROOT, "scripts", "s3-hot.env"));
  }
  // Active profile in scripts/s3.env wins over stale s3-hot.env snapshot.
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"), { override: true });
  if (!preferHot) {
    loadDotEnv(path.join(ROOT, "scripts", "s3-hot.env"), { override: true });
  }
}

export function loadRepoEnv() {
  loadDotEnv(path.join(ROOT, "scripts", "timeweb.env"));
  loadS3Env();
  loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
  loadDotEnv(path.join(ROOT, "scripts", "design-pack.env"));
  return ROOT;
}
