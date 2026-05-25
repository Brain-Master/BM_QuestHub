#!/usr/bin/env node
/**
 * Deploy apps/yandex-mos-enrolled-sync → YCF bm-mos-enrolled-sync + timer every 15 min.
 *
 *   node scripts/deploy-yandex-mos-enrolled-sync.mjs
 *
 * Requires: yc CLI, scripts/sheets.env or GOOGLE_SERVICE_ACCOUNT_JSON
 * Optional: secret/mos-enrolled-sync.cookies.json (fallback if public API blocked from YCF)
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import { DEFAULT_COOKIES_S3_KEY, saveCookiesToS3 } from "./lib/mos-enrolled-cookie-store.mjs";
import { loadMosEnrolledCookies } from "./lib/mos-enrolled-cookies.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(ROOT, "apps", "yandex-mos-enrolled-sync");
const FUNCTION_NAME = "bm-mos-enrolled-sync";
const TRIGGER_NAME = "bm-mos-enrolled-sync-timer";
const SERVICE_ACCOUNT_NAME = "bm-mos-enrolled-sync-sa";
const RUNTIME = "nodejs22";
const ENTRYPOINT = "index.handler";
/** Yandex timer cron (6 fields): every 15 minutes */
const CRON = "0/15 * * * ? *";
const YCF_PACKAGE_BUCKET =
  process.env.YCF_PACKAGE_BUCKET?.trim() || "bm-questhub";
function ycfPackageObject() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `ycf/${FUNCTION_NAME}/function-${stamp}.zip`;
}

const YC_CANDIDATES = [
  process.env.YC_BIN?.trim(),
  path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe"),
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

function yc(bin, args) {
  const r = spawnSync(bin, [...args, "--format", "json"], {
    encoding: "utf8",
    shell: false,
  });
  if (r.status !== 0) {
    throw new Error(`yc ${args.join(" ")}\n${r.stderr || r.stdout || "(no output)"}`);
  }
  return JSON.parse(r.stdout || "{}");
}

function ycText(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8", shell: false });
  if (r.status !== 0) {
    throw new Error(`yc ${args.join(" ")}\n${r.stderr || r.stdout || "(no output)"}`);
  }
  return (r.stdout || "").trim();
}

function functionExists(bin, name) {
  try {
    yc(bin, ["serverless", "function", "get", "--name", name]);
    return true;
  } catch {
    return false;
  }
}

async function uploadCookiesToS3() {
  const jar = loadMosEnrolledCookies(ROOT);
  if (Object.keys(jar).length === 0) {
    console.log(
      "[deploy] skip cookies — public API; optional: secret/mos-enrolled-sync.cookies.json",
    );
    return;
  }
  const ok = await saveCookiesToS3(jar);
  if (!ok) throw new Error("S3 upload failed — check scripts/s3.env");
  console.log(`[deploy] cookies → s3://${process.env.S3_BUCKET}/${DEFAULT_COOKIES_S3_KEY}`);
}

function readGoogleSaBase64() {
  loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
  loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (b64) return b64;
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing — run make setup-sheets-env");
  }
  return Buffer.from(inline, "utf8").toString("base64");
}

function stageBundle() {
  const bundledDir = path.join(APP, "bundled", "bm-mos-enrolled-sync");
  for (const name of fs.readdirSync(bundledDir)) {
    if (!name.endsWith(".mjs")) continue;
    fs.unlinkSync(path.join(bundledDir, name));
  }
  for (const name of fs.readdirSync(APP)) {
    if (name.startsWith("mos-enrolled") || name === "telegram-alert.mjs") {
      fs.unlinkSync(path.join(APP, name));
    }
  }

  for (const name of fs.readdirSync(path.join(ROOT, "scripts", "lib"))) {
    if (name.endsWith(".test.mjs")) continue;
    if (
      name.startsWith("mos-enrolled") ||
      name === "telegram-alert.mjs"
    ) {
      fs.copyFileSync(
        path.join(ROOT, "scripts", "lib", name),
        path.join(bundledDir, name),
      );
      fs.copyFileSync(path.join(ROOT, "scripts", "lib", name), path.join(APP, name));
    }
  }

  const npm = spawnSync("npm", ["install", "--omit=dev"], {
    cwd: APP,
    stdio: "inherit",
    shell: true,
  });
  if (npm.status !== 0) throw new Error("npm install failed in yandex-mos-enrolled-sync");

  const linked = path.join(APP, "node_modules", "bm-mos-enrolled-sync");
  fs.rmSync(linked, { recursive: true, force: true });
  fs.cpSync(bundledDir, linked, { recursive: true });
}

function zipFunction() {
  const zipPath = path.join(APP, "function.zip");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const rootMjs = fs
    .readdirSync(APP)
    .filter(
      (n) =>
        n.endsWith(".mjs") &&
        (n.startsWith("mos-enrolled") || n === "telegram-alert.mjs"),
    );
  const items = ["index.js", "package.json", "bundled", "package-lock.json", ...rootMjs, "node_modules"];
  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path ${items.map((i) => `'${i}'`).join(",")} -DestinationPath 'function.zip' -Force`,
    ],
    { cwd: APP, encoding: "utf8", shell: true },
  );
  if (ps.status !== 0) {
    throw new Error(`zip failed: ${ps.stderr || ps.stdout}`);
  }
  return zipPath;
}

function buildEnvironment() {
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));

  const hotId =
    process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
    "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";

  const pairs = {
    GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: readGoogleSaBase64(),
    GOOGLE_SHEETS_HOT_SPREADSHEET_ID: hotId,
    GOOGLE_SHEETS_HOT_RANGE_GROUPS: "'Группы'!A:AZ",
    GOOGLE_SHEETS_HOT_RANGE_FORMATS: "'Форматы'!A:AZ",
    MOS_ENROLLED_COOKIES_S3_KEY: DEFAULT_COOKIES_S3_KEY,
    MOS_ENROLLED_SKIP_LOCAL_COOKIE_WRITE: "1",
    MOS_ENROLLED_URL_DELAY_MS: "300",
    MOS_ENROLLED_FETCH_TIMEOUT_MS: "8000",
    MOS_ENROLLED_AUTO_PUBLISH: process.env.MOS_ENROLLED_AUTO_PUBLISH?.trim() || "0",
    S3_BUCKET: process.env.S3_BUCKET?.trim() || "",
    S3_ENDPOINT: process.env.S3_ENDPOINT?.trim() || "https://s3.twcstorage.ru",
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION?.trim() || "ru-1",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
  };

  const tgToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const tgChat = process.env.TELEGRAM_CHAT_ID?.trim();
  if (tgToken && tgChat) {
    pairs.TELEGRAM_BOT_TOKEN = tgToken;
    pairs.TELEGRAM_CHAT_ID = tgChat;
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

function uploadFunctionPackage(ycBin, zipPath) {
  const objectName = ycfPackageObject();
  const uri = `s3://${YCF_PACKAGE_BUCKET}/${objectName}`;
  console.log(`[deploy] upload package → ${uri}`);
  ycText(ycBin, ["storage", "s3", "cp", zipPath, uri]);
  const sha256 = crypto
    .createHash("sha256")
    .update(fs.readFileSync(zipPath))
    .digest("hex");
  return { bucket: YCF_PACKAGE_BUCKET, object: objectName, sha256 };
}

function ensureServiceAccount(ycBin) {
  try {
    const sa = yc(ycBin, ["iam", "service-account", "get", "--name", SERVICE_ACCOUNT_NAME]);
    return sa.id;
  } catch {
    const sa = yc(ycBin, [
      "iam",
      "service-account",
      "create",
      "--name",
      SERVICE_ACCOUNT_NAME,
    ]);
    console.log(`[deploy] created service account ${SERVICE_ACCOUNT_NAME}`);
    return sa.id;
  }
}

function ensureFunctionInvoker(ycBin, serviceAccountId) {
  try {
    ycText(ycBin, [
      "serverless",
      "function",
      "add-access-binding",
      "--name",
      FUNCTION_NAME,
      "--role",
      "serverless.functions.invoker",
      "--service-account-id",
      serviceAccountId,
    ]);
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("already") && !msg.includes("ALREADY_EXISTS")) throw err;
  }
}

function ensureTimerTrigger(ycBin, serviceAccountId) {
  try {
    ycText(ycBin, [
      "serverless",
      "trigger",
      "get",
      "--name",
      TRIGGER_NAME,
    ]);
    console.log(`[deploy] timer trigger ${TRIGGER_NAME} exists`);
  } catch {
    ycText(ycBin, [
      "serverless",
      "trigger",
      "create",
      "timer",
      TRIGGER_NAME,
      "--cron-expression",
      CRON,
      "--invoke-function-name",
      FUNCTION_NAME,
      "--invoke-function-tag",
      "$latest",
      "--invoke-function-service-account-id",
      serviceAccountId,
    ]);
    console.log(`[deploy] created timer ${TRIGGER_NAME} (${CRON})`);
  }
}

async function main() {
  const ycBin = findYc();
  console.log(`[deploy] ${FUNCTION_NAME}`);

  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

  stageBundle();
  await uploadCookiesToS3();
  const envPairs = buildEnvironment();
  const zipPath = zipFunction();
  const pkg = uploadFunctionPackage(ycBin, zipPath);
  const serviceAccountId = ensureServiceAccount(ycBin);

  if (!functionExists(ycBin, FUNCTION_NAME)) {
    yc(ycBin, ["serverless", "function", "create", "--name", FUNCTION_NAME]);
  }

  ensureFunctionInvoker(ycBin, serviceAccountId);

  yc(ycBin, [
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
    "180s",
    "--service-account-id",
    serviceAccountId,
    "--package-bucket-name",
    pkg.bucket,
    "--package-object-name",
    pkg.object,
    "--package-sha256",
    pkg.sha256,
    ...envArgs(envPairs),
  ]);

  ensureTimerTrigger(ycBin, serviceAccountId);

  const fn = yc(ycBin, ["serverless", "function", "get", "--name", FUNCTION_NAME]);
  const id = fn.id;
  const url = `https://functions.yandexcloud.net/${id}`;
  const out = path.join(ROOT, "secret", "mos-enrolled-sync.deploy.txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    `# YCF ${FUNCTION_NAME} — gitignored
FUNCTION_URL=${url}
CRON=${CRON}
# Cookies: s3://${process.env.S3_BUCKET || "<bucket>"}/${DEFAULT_COOKIES_S3_KEY}
# Refresh: node scripts/upload-mos-enrolled-cookies.mjs
# Manual dry-run: yc serverless function invoke --name ${FUNCTION_NAME} --data '{"dryRun":true}'
`,
    "utf8",
  );
  console.log(`[deploy] ${url}`);
  console.log(`[deploy] wrote ${path.relative(ROOT, out)}`);
}

main().catch((e) => {
  console.error("[deploy]", e.message || e);
  process.exit(1);
});
