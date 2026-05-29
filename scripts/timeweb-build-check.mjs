#!/usr/bin/env node
/**
 * Preflight: same S3-backed production build as Timeweb App Platform.
 * Fails before timeweb-deploy when TypeScript or verify:s3 would break the remote build.
 *
 *   node scripts/timeweb-build-check.mjs
 *   SKIP_TIMEWEB_BUILD_CHECK=1 make publish-sheet-cold   # skip preflight
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const WEB = path.join(ROOT, "apps", "web");

function timewebBuildEnv() {
  return {
    ...process.env,
    NEXT_PUBLIC_S3_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim() ||
      "https://storage.yandexcloud.net/bm-questhub",
    OFFERS_SNAPSHOT_SOURCE: "s3",
    SITE_SNAPSHOT_SOURCE: "s3",
    SITE_SNAPSHOT_STRICT: process.env.SITE_SNAPSHOT_STRICT?.trim() || "1",
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://quest.b-master.pro",
    NEXT_PUBLIC_LEAD_SUBMIT_URL:
      process.env.NEXT_PUBLIC_LEAD_SUBMIT_URL?.trim() ||
      "https://functions.yandexcloud.net/d4ellekng389grh5rck4",
    NEXT_PUBLIC_OPS_REPORT_URL:
      process.env.NEXT_PUBLIC_OPS_REPORT_URL?.trim() ||
      "https://functions.yandexcloud.net/d4eugco206uh65ivpbtm",
  };
}

export function runTimewebBuildCheck() {
  const s3Base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  if (!s3Base) {
    console.warn(
      "[timeweb-build-check] WARN: NEXT_PUBLIC_S3_PUBLIC_BASE_URL unset — using preflight fallback (set in App Platform env for remote builds)",
    );
  } else if (!s3Base.includes("storage.yandexcloud.net")) {
    console.warn(
      `[timeweb-build-check] WARN: NEXT_PUBLIC_S3_PUBLIC_BASE_URL is not Yandex: ${s3Base}`,
    );
  }
  console.log("[timeweb-build-check] npm run build (SITE_SNAPSHOT_SOURCE=s3)");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: WEB,
    env: timewebBuildEnv(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log("[timeweb-build-check] OK");
}

const isCli = process.argv[1]?.includes("timeweb-build-check.mjs");
if (isCli) {
  runTimewebBuildCheck();
}
