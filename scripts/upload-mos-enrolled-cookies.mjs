#!/usr/bin/env node
/**
 * Upload secret/mos-enrolled-sync.cookies.json → S3 (shared by YCF + local).
 *
 *   node scripts/upload-mos-enrolled-cookies.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import { COOKIES_FILE_REL, loadMosEnrolledCookies } from "./lib/mos-enrolled-cookies.mjs";
import {
  DEFAULT_COOKIES_S3_KEY,
  saveCookiesToS3,
} from "./lib/mos-enrolled-cookie-store.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));

async function main() {
  const jar = loadMosEnrolledCookies(ROOT);
  if (Object.keys(jar).length === 0) {
    console.error(
      `[upload-cookies] empty — fill ${COOKIES_FILE_REL} first`,
    );
    process.exit(1);
  }
  const ok = await saveCookiesToS3(jar);
  if (!ok) {
    console.error("[upload-cookies] S3_BUCKET / AWS keys missing in scripts/s3.env");
    process.exit(1);
  }
  console.log(
    `[upload-cookies] ${Object.keys(jar).length} cookies → s3://${process.env.S3_BUCKET}/${DEFAULT_COOKIES_S3_KEY}`,
  );
}

main().catch((e) => {
  console.error("[upload-cookies]", e.message || e);
  process.exit(1);
});
