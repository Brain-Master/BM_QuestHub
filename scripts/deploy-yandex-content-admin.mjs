#!/usr/bin/env node
/**
 * Deploy apps/yandex-content-admin to Yandex Cloud Functions (bm-content-admin).
 * Reads scripts/s3.env, scripts/timeweb.env, secret/content-admin.token
 *
 *   node scripts/deploy-yandex-content-admin.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const APP = path.join(ROOT, "apps", "yandex-content-admin");
const FUNCTION_NAME = "bm-content-admin";
const RUNTIME = "nodejs22";
const ENTRYPOINT = "index.handler";

const YC_CANDIDATES = [
  process.env.YC_BIN?.trim(),
  path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe"),
  "C:\\Users\\Xipsin\\yandex-cloud\\bin\\yc.exe",
  "yc",
].filter(Boolean);

function findYc() {
  for (const bin of YC_CANDIDATES) {
    if (bin === "yc") {
      const w = spawnSync("where.exe", ["yc"], { encoding: "utf8", shell: true });
      if (w.status === 0 && w.stdout?.trim()) {
        return w.stdout.trim().split(/\r?\n/)[0].trim();
      }
      continue;
    }
    if (fs.existsSync(bin)) return bin;
  }
  throw new Error("yc CLI not found; set YC_BIN or install Yandex Cloud CLI");
}

function yc(bin, args, options = {}) {
  const r = spawnSync(bin, args, {
    encoding: "utf8",
    cwd: options.cwd ?? ROOT,
    shell: false,
    env: { ...process.env, ...options.env },
  });
  if (r.status !== 0) {
    throw new Error(
      `yc ${args.join(" ")}\n${r.stderr || r.stdout || "(no output)"}`,
    );
  }
  return (r.stdout || "").trim();
}

function readToken() {
  const p = path.join(ROOT, "secret", "content-admin.token");
  if (!fs.existsSync(p)) {
    throw new Error("missing secret/content-admin.token — run: node scripts/setup-content-admin.mjs");
  }
  return fs.readFileSync(p, "utf8").trim();
}

function loadEnvFile(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return {};
  loadDotEnv(p);
  return process.env;
}

function functionExists(bin, name) {
  try {
    yc(bin, ["serverless", "function", "get", "--name", name]);
    return true;
  } catch {
    return false;
  }
}

function zipFunction() {
  const zipPath = path.join(APP, "function.zip");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const npm = spawnSync("npm", ["install", "--omit=dev"], {
    cwd: APP,
    encoding: "utf8",
    shell: true,
  });
  if (npm.status !== 0) {
    throw new Error(`npm install failed: ${npm.stderr || npm.stdout}`);
  }

  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path 'index.js','package.json','node_modules' -DestinationPath 'function.zip' -Force`,
    ],
    { cwd: APP, encoding: "utf8", shell: true },
  );
  if (ps.status !== 0) {
    throw new Error(`zip failed: ${ps.stderr || ps.stdout}`);
  }
  return zipPath;
}

function buildEnvironment() {
  loadEnvFile("scripts/s3.env");
  loadEnvFile("scripts/timeweb.env");
  loadDotEnv(path.join(ROOT, "apps", "yandex-content-admin", ".env"));

  const bucket = process.env.S3_BUCKET?.trim();
  const publicBase =
    process.env.S3_PUBLIC_BASE_URL?.trim() ||
    (bucket ? `https://${bucket}.s3.twcstorage.ru` : "");

  const pairs = {
    CONTENT_ADMIN_TOKEN: readToken(),
    S3_PUBLIC_BASE_URL: publicBase,
    S3_BUCKET: bucket,
    S3_ENDPOINT: process.env.S3_ENDPOINT?.trim() || "https://s3.twcstorage.ru",
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION?.trim() || "ru-1",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim(),
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
    ALLOWED_ORIGINS:
      process.env.ALLOWED_ORIGINS?.trim() ||
      "https://quest.b-master.pro,https://docs.google.com,https://script.google.com",
    CONTENT_REBUILD_REPOSITORY:
      process.env.CONTENT_REBUILD_REPOSITORY?.trim() || "Brain-Master/BM_QuestHub",
    CONTENT_REBUILD_REF:
      process.env.CONTENT_REBUILD_REF?.trim() || "main",
    SHEET_SYNC_WORKFLOW: "sheet-sync.yml",
    TIMEWEB_API_TOKEN: process.env.TIMEWEB_API_TOKEN?.trim() || "",
    TIMEWEB_APP_ID: process.env.TIMEWEB_APP_ID?.trim() || "",
    CONTENT_REBUILD_GITHUB_TOKEN:
      process.env.CONTENT_REBUILD_GITHUB_TOKEN?.trim() ||
      process.env.GITHUB_TOKEN?.trim() ||
      "",
  };

  const missing = ["S3_BUCKET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_PUBLIC_BASE_URL"].filter(
    (k) => !pairs[k],
  );
  if (missing.length) {
    throw new Error(`missing S3 env (${missing.join(", ")}) — run make timeweb-s3-setup`);
  }

  return pairs;
}

function envArgs(pairs) {
  const out = [];
  for (const [k, v] of Object.entries(pairs)) {
    if (v === undefined || v === null || String(v).trim() === "") continue;
    out.push("--environment", `${k}=${v}`);
  }
  return out;
}

function updateDeployTxt(functionId, token) {
  const url = `https://functions.yandexcloud.net/${functionId}`;
  const out = path.join(ROOT, "secret", "content-admin.deploy.txt");
  const body = `# Content admin — local only (secret/ is gitignored)
# YCF: ${FUNCTION_NAME} (${functionId})

CONTENT_ADMIN_TOKEN=${token}

CONTENT_ADMIN_URL=${url}

# Apps Script per spreadsheet:
#   Hot table  → SYNC_TIER=hot
#   Cold table → SYNC_TIER=cold

# Function env also needs (if not set):
# CONTENT_REBUILD_GITHUB_TOKEN — PAT with actions:write for sheet-sync.yml
# CONTENT_REBUILD_REPOSITORY=Brain-Master/BM_QuestHub
# TIMEWEB_APP_ID — from: node scripts/timeweb-apps.mjs list
`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, body, "utf8");
  console.log(`[deploy] wrote ${path.relative(ROOT, out)}`);
  console.log(`[deploy] CONTENT_ADMIN_URL=${url}`);
  return url;
}

async function main() {
  const ycBin = findYc();
  console.log(`[deploy] using ${ycBin}`);

  const envPairs = buildEnvironment();
  const zipPath = zipFunction();

  if (!functionExists(ycBin, FUNCTION_NAME)) {
    console.log(`[deploy] creating function ${FUNCTION_NAME}`);
    yc(ycBin, [
      "serverless",
      "function",
      "create",
      "--name",
      FUNCTION_NAME,
    ]);
  }

  const versionOut = yc(ycBin, [
    "serverless",
    "function",
    "version",
    "create",
    "--function-name",
    FUNCTION_NAME,
    "--runtime",
    RUNTIME,
    "--entrypoint",
    ENTRYPOINT,
    "--memory",
    "256m",
    "--execution-timeout",
    "30s",
    "--source-path",
    zipPath,
    ...envArgs(envPairs),
  ]);

  const idMatch = /id:\s*(\S+)/.exec(versionOut) || /"id":\s*"([^"]+)"/.exec(versionOut);
  if (idMatch) console.log(`[deploy] version ${idMatch[1]}`);

  try {
    yc(ycBin, [
      "serverless",
      "function",
      "allow-unauthenticated-invoke",
      FUNCTION_NAME,
    ]);
  } catch (e) {
    console.warn("[deploy] allow-unauthenticated-invoke:", e.message);
  }

  const fnJson = yc(ycBin, [
    "serverless",
    "function",
    "get",
    "--name",
    FUNCTION_NAME,
    "--format",
    "json",
  ]);
  const fn = JSON.parse(fnJson);
  const functionId = fn.id;
  updateDeployTxt(functionId, envPairs.CONTENT_ADMIN_TOKEN);

  if (!envPairs.CONTENT_REBUILD_GITHUB_TOKEN) {
    console.warn(
      "[deploy] CONTENT_REBUILD_GITHUB_TOKEN not set — /sync/* will skip GitHub until PAT is added",
    );
  }
  if (!envPairs.TIMEWEB_APP_ID) {
    console.warn("[deploy] TIMEWEB_APP_ID not set — cold Timeweb deploy in Actions will skip");
  }

  console.log("[deploy] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
