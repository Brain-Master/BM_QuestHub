#!/usr/bin/env node
/**
 * Generate CONTENT_ADMIN_TOKEN and write secret/content-admin.deploy.txt
 * (instructions for YCF env + Apps Script — not committed).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const SECRET_DIR = path.join(ROOT, "secret");
const OUT = path.join(SECRET_DIR, "content-admin.deploy.txt");
const TOKEN_FILE = path.join(SECRET_DIR, "content-admin.token");

function readOrCreateToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    return fs.readFileSync(TOKEN_FILE, "utf8").trim();
  }
  const token = crypto.randomBytes(32).toString("base64url");
  fs.mkdirSync(SECRET_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_FILE, `${token}\n`, "utf8");
  return token;
}

loadDotEnv(path.join(ROOT, "apps", "yandex-content-admin", ".env"));
const token = readOrCreateToken();
const existingUrl = process.env.CONTENT_ADMIN_FUNCTION_URL?.trim() || "";

const body = `# Content admin — local only (secret/ is gitignored)
# Set these on Yandex Cloud Function yandex-content-admin, then in Apps Script properties.

CONTENT_ADMIN_TOKEN=${token}

CONTENT_ADMIN_URL=${existingUrl || "https://functions.yandexcloud.net/<DEPLOY_FUNCTION_FIRST>"}

# Apps Script per spreadsheet:
#   Hot table  → SYNC_TIER=hot
#   Cold table → SYNC_TIER=cold

# GitHub PAT for /sync/* (repo + workflow scopes):
#   gh auth login && gh auth token > secret/github.token
#   make deploy-yandex-content-admin
CONTENT_REBUILD_REPOSITORY=Brain-Master/BM_QuestHub
S3_* from scripts/s3.env
TIMEWEB_* from scripts/timeweb.env

# Deploy function (Yandex CLI example):
#   cd apps/yandex-content-admin && npm install && zip -r function.zip index.js node_modules package.json
#   yc serverless function version create ...
`;

fs.mkdirSync(SECRET_DIR, { recursive: true });
fs.writeFileSync(OUT, body, "utf8");
console.log(`[setup-content-admin] wrote ${path.relative(ROOT, OUT)}`);
console.log("[setup-content-admin] open file for CONTENT_ADMIN_URL and TOKEN");
