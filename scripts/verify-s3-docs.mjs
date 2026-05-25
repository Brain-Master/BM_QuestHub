#!/usr/bin/env node
/**
 * Fail if active docs/scripts still reference legacy public S3 URL (not allowlisted).
 *   node scripts/verify-s3-docs.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PATTERN = "bm-questhub\\.s3|s3://bm-questhub";
const GLOBS = ["docs", "scripts", "apps", "Makefile", ".github"];
const ALLOW = [
  "S3_LEGACY",
  "legacy",
  "migrate",
  "decommission",
  "YCF_PACKAGE",
  "bm-questhub-static",
  "bm-questhub-",
  "LEGACY_PUBLIC",
  "s3-storage-migration",
  "content-pipeline-status-plan",
];

function main() {
  const args = ["rg", "-n", PATTERN, ...GLOBS, "--glob", "!**/node_modules/**"];
  const r = spawnSync(args[0], args.slice(1), { cwd: ROOT, encoding: "utf8" });
  const lines = (r.stdout || "")
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !ALLOW.some((a) => line.includes(a)));

  if (lines.length) {
    console.error("[verify-s3-docs] legacy S3 URL still referenced:\n");
    for (const line of lines) console.error(line);
    console.error(
      "\nUse bm-quest-s3-hot or allowlist in scripts/verify-s3-docs.mjs",
    );
    process.exit(1);
  }
  console.log("[verify-s3-docs] OK — no active bm-questhub S3 URLs");
}

main();
