#!/usr/bin/env node
/**
 * Fail if active docs/scripts still reference legacy Timeweb hot public URLs.
 *   node scripts/verify-s3-docs.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PATTERNS = [
  "bm-quest-s3-hot\\.s3",
  "bm-quest-s3-hot\\.s3\\.twcstorage",
  "s3\\.twcstorage\\.ru/bm-quest-s3-hot",
];
const GLOBS = ["docs", "scripts", "apps", "Makefile", ".github"];
const ALLOW = [
  "S3_LEGACY",
  "S3_TIMEWEB",
  "legacy",
  "rollback",
  "migrate",
  "cross",
  "decommission",
  "setup-s3-hot",
  "bm-questhub.s3",
  "s3-storage-migration",
  "timeweb-object-storage",
  "content-pipeline-status-plan",
  "migrate_s3_to_yc",
  "bm-questhub-s3-hot",
  "LEGACY_PUBLIC",
  "TWCFB",
];

function main() {
  for (const pattern of PATTERNS) {
    const args = [
      "rg",
      "-n",
      pattern,
      ...GLOBS,
      "--glob",
      "!**/node_modules/**",
    ];
    const r = spawnSync(args[0], args.slice(1), { cwd: ROOT, encoding: "utf8" });
    const lines = (r.stdout || "")
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !ALLOW.some((a) => line.includes(a)));

    if (lines.length) {
      console.error(
        `[verify-s3-docs] legacy Timeweb hot URL still referenced (${pattern}):\n`,
      );
      for (const line of lines) console.error(line);
      console.error(
        "\nUse https://storage.yandexcloud.net/bm-questhub or allowlist in scripts/verify-s3-docs.mjs",
      );
      process.exit(1);
    }
  }
  console.log("[verify-s3-docs] OK — no active Timeweb hot S3 URLs");
}

main();
