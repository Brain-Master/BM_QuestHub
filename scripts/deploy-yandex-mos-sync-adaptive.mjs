#!/usr/bin/env node
/**
 * Deploy adaptive mos.ru stack:
 *   bm-mos-enrolled-sync (no timer)
 *   bm-mos-sync-controller (timer every 2 min)
 *   bm-schedule-traffic (public POST)
 *
 *   node scripts/deploy-yandex-mos-sync-adaptive.mjs
 *   node scripts/verify-mos-sync-adaptive.mjs
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import { DEFAULT_COOKIES_S3_KEY, saveCookiesToS3 } from "./lib/mos-enrolled-cookie-store.mjs";
import { loadMosEnrolledCookies } from "./lib/mos-enrolled-cookies.mjs";
import { readTelegramEnv } from "./lib/read-ycf-telegram-env.mjs";
import {
  assertYcfS3LibsPresent,
  isYcfMosSyncLibFile,
  YCF_S3_LIB_FILES,
} from "./lib/ycf-s3-lib-files.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(ROOT, "scripts", "lib");

const SYNC_APP = path.join(ROOT, "apps", "yandex-mos-enrolled-sync");
const CONTROLLER_APP = path.join(ROOT, "apps", "yandex-mos-sync-controller");
const TRAFFIC_APP = path.join(ROOT, "apps", "yandex-schedule-traffic");

const SYNC_NAME = "bm-mos-enrolled-sync";
const CONTROLLER_NAME = "bm-mos-sync-controller";
const TRAFFIC_NAME = "bm-schedule-traffic";
const SYNC_TIMER = "bm-mos-enrolled-sync-timer";
const CONTROLLER_TIMER = "bm-mos-sync-controller-timer";
const SA_NAME = "bm-mos-enrolled-sync-sa";
const RUNTIME = "nodejs22";
const YCF_PACKAGE_BUCKET = process.env.YCF_PACKAGE_BUCKET?.trim() || "bm-questhub";

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
  throw new Error("yc CLI not found");
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

function copyLibs(appDir, names) {
  for (const name of names) {
    fs.copyFileSync(path.join(LIB, name), path.join(appDir, name));
  }
}

function npmInstall(appDir) {
  const npm = spawnSync("npm", ["install", "--omit=dev"], {
    cwd: appDir,
    stdio: "inherit",
    shell: true,
  });
  if (npm.status !== 0) throw new Error(`npm install failed: ${appDir}`);
}

function zipApp(appDir, rootFiles) {
  const zipPath = path.join(appDir, "function.zip");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  const items = [...rootFiles, "index.js", "package.json", "package-lock.json", "node_modules"];
  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path ${items.map((i) => `'${i}'`).join(",")} -DestinationPath 'function.zip' -Force`,
    ],
    { cwd: appDir,
      encoding: "utf8",
      shell: true },
  );
  if (ps.status !== 0) throw new Error(`zip failed: ${ps.stderr || ps.stdout}`);
  return zipPath;
}

function stageSyncApp() {
  const bundledDir = path.join(SYNC_APP, "bundled", "bm-mos-enrolled-sync");
  fs.mkdirSync(bundledDir, { recursive: true });
  for (const name of fs.readdirSync(bundledDir)) {
    if (name.endsWith(".mjs")) fs.unlinkSync(path.join(bundledDir, name));
  }
  const syncLibs = fs.readdirSync(LIB).filter(isYcfMosSyncLibFile);
  for (const name of syncLibs) {
    fs.copyFileSync(path.join(LIB, name), path.join(bundledDir, name));
    fs.copyFileSync(path.join(LIB, name), path.join(SYNC_APP, name));
  }
  assertYcfS3LibsPresent(SYNC_APP);
  assertYcfS3LibsPresent(bundledDir);
  npmInstall(SYNC_APP);
  const linked = path.join(SYNC_APP, "node_modules", "bm-mos-enrolled-sync");
  fs.rmSync(linked, { recursive: true, force: true });
  fs.cpSync(bundledDir, linked, { recursive: true });
  const rootMjs = fs
    .readdirSync(SYNC_APP)
    .filter((n) => n.endsWith(".mjs"));
  return zipApp(SYNC_APP, rootMjs);
}

function stageSimpleApp(appDir, libNames) {
  for (const name of fs.readdirSync(appDir)) {
    if (name.endsWith(".mjs") && name !== "index.js") {
      fs.unlinkSync(path.join(appDir, name));
    }
  }
  copyLibs(appDir, libNames);
  assertYcfS3LibsPresent(appDir);
  npmInstall(appDir);
  const mjs = fs.readdirSync(appDir).filter((n) => n.endsWith(".mjs") && n !== "index.js");
  return zipApp(appDir, mjs);
}

function readGithubToken() {
  for (const key of ["CONTENT_REBUILD_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"]) {
    if (process.env[key]?.trim()) return process.env[key].trim();
  }
  const secretFile = path.join(ROOT, "secret", "github.token");
  if (fs.existsSync(secretFile)) return fs.readFileSync(secretFile, "utf8").trim();
  return "";
}

function readGoogleSaBase64() {
  loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (b64) return b64;
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing");
  return Buffer.from(inline, "utf8").toString("base64");
}

function buildSyncEnv(syncUrl) {
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
    MOS_ENROLLED_FETCH_TIMEOUT_MS: "15000",
    MOS_ENROLLED_SKIP_S3_COOKIES: "1",
    MOS_ENROLLED_AUTO_PUBLISH: process.env.MOS_ENROLLED_AUTO_PUBLISH?.trim() || "1",
    MOS_ENROLLED_TG_ENABLED: process.env.MOS_ENROLLED_TG_ENABLED?.trim() || "1",
    S3_BUCKET: process.env.S3_BUCKET?.trim() || "",
    S3_ENDPOINT:
      process.env.S3_ENDPOINT?.trim() || "https://storage.yandexcloud.net",
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION?.trim() || "ru-1",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    MOS_SYNC_USE_PID: "1",
    MOS_SYNC_PIPELINE: "legacy",
    MOS_OPS_S3_TIMEOUT_MS: process.env.MOS_OPS_S3_TIMEOUT_MS?.trim() || "30000",
  };
  const tg = readTelegramEnv({ root: ROOT, ycBin: findYc() });
  if (tg) {
    pairs.TELEGRAM_BOT_TOKEN = tg.TELEGRAM_BOT_TOKEN;
    pairs.TELEGRAM_CHAT_ID = tg.TELEGRAM_CHAT_ID;
  } else {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const tgChat = process.env.TELEGRAM_CHAT_ID?.trim();
    if (tgToken && tgChat) {
      pairs.TELEGRAM_BOT_TOKEN = tgToken;
      pairs.TELEGRAM_CHAT_ID = tgChat;
    }
  }
  const ghToken = readGithubToken();
  if (ghToken) {
    pairs.CONTENT_REBUILD_GITHUB_TOKEN = ghToken;
    pairs.CONTENT_REBUILD_REPOSITORY =
      process.env.CONTENT_REBUILD_REPOSITORY?.trim() || "Brain-Master/BM_QuestHub";
    pairs.SHEET_SYNC_WORKFLOW =
      process.env.SHEET_SYNC_WORKFLOW?.trim() || "sheet-sync.yml";
  }
  return pairs;
}

function buildControllerEnv(syncUrl, cronSecret) {
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  loadDotEnv(path.join(ROOT, "secret", "mos-ymq-pipeline.deploy.txt"));
  const pairs = {
    MOS_ENROLLED_SYNC_FUNCTION_URL: syncUrl,
    MOS_SYNC_PIPELINE: process.env.MOS_SYNC_PIPELINE?.trim() || "ymq",
    MOS_CONTROLLER_CRON_SECRET: cronSecret,
    S3_BUCKET: process.env.S3_BUCKET?.trim() || "",
    S3_ENDPOINT:
      process.env.S3_ENDPOINT?.trim() || "https://storage.yandexcloud.net",
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION?.trim() || "ru-1",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    MOS_SYNC_USE_PID: "1",
    MOS_SYNC_T_MIN_SEC: process.env.MOS_SYNC_T_MIN_SEC?.trim() || "300",
    MOS_SYNC_T_MAX_SEC: process.env.MOS_SYNC_T_MAX_SEC?.trim() || "86400",
    MOS_OPS_S3_TIMEOUT_MS: process.env.MOS_OPS_S3_TIMEOUT_MS?.trim() || "30000",
  };
  const planner = process.env.MOS_SYNC_PLANNER_FUNCTION_URL?.trim();
  const finalizer = process.env.MOS_SYNC_FINALIZER_FUNCTION_URL?.trim();
  if (planner) pairs.MOS_SYNC_PLANNER_FUNCTION_URL = planner;
  if (finalizer) pairs.MOS_SYNC_FINALIZER_FUNCTION_URL = finalizer;
  return pairs;
}

function buildTrafficEnv() {
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  return {
    ALLOWED_ORIGINS:
      process.env.SCHEDULE_PULSE_ALLOWED_ORIGINS?.trim() ||
      "https://quest.b-master.pro,https://www.quest.b-master.pro,http://localhost:3000",
    S3_BUCKET: process.env.S3_BUCKET?.trim() || "",
    S3_ENDPOINT:
      process.env.S3_ENDPOINT?.trim() || "https://storage.yandexcloud.net",
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION?.trim() || "ru-1",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
  };
}

function envArgs(pairs) {
  const out = [];
  for (const [k, v] of Object.entries(pairs)) {
    if (v === undefined || v === null || String(v).trim() === "") continue;
    out.push("--environment", `${k}=${v}`);
  }
  return out;
}

function uploadZip(ycBin, zipPath, functionName) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const object = `ycf/${functionName}/function-${stamp}.zip`;
  const uri = `s3://${YCF_PACKAGE_BUCKET}/${object}`;
  ycText(ycBin, ["storage", "s3", "cp", zipPath, uri]);
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(zipPath)).digest("hex");
  return { bucket: YCF_PACKAGE_BUCKET, object, sha256 };
}

function ensureSa(ycBin) {
  try {
    return yc(ycBin, ["iam", "service-account", "get", "--name", SA_NAME]).id;
  } catch {
    return yc(ycBin, ["iam", "service-account", "create", "--name", SA_NAME]).id;
  }
}

function ensureFunction(ycBin, name) {
  try {
    yc(ycBin, ["serverless", "function", "get", "--name", name]);
  } catch {
    yc(ycBin, ["serverless", "function", "create", "--name", name]);
  }
}

function deployVersion(ycBin, name, pkg, saId, env, timeout, entrypoint = "index.handler", asyncOpts = null) {
  const args = [
    "serverless",
    "function",
    "version",
    "create",
    "--function-name",
    name,
    "--runtime",
    RUNTIME,
    "--entrypoint",
    entrypoint,
    "--memory",
    "256m",
    "--execution-timeout",
    timeout,
    "--service-account-id",
    saId,
    "--package-bucket-name",
    pkg.bucket,
    "--package-object-name",
    pkg.object,
    "--package-sha256",
    pkg.sha256,
    ...envArgs(env),
  ];
  if (asyncOpts?.saId) {
    args.push(
      "--async-max-retries",
      String(asyncOpts.retries ?? 3),
      "--async-service-account-id",
      asyncOpts.saId,
    );
  }
  yc(ycBin, args);
}

function functionUrl(ycBin, name) {
  const fn = yc(ycBin, ["serverless", "function", "get", "--name", name]);
  return `https://functions.yandexcloud.net/${fn.id}`;
}

function ensureInvoker(ycBin, fnName, saId) {
  try {
    ycText(ycBin, [
      "serverless",
      "function",
      "add-access-binding",
      "--name",
      fnName,
      "--role",
      "serverless.functions.invoker",
      "--service-account-id",
      saId,
    ]);
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("already") && !msg.includes("ALREADY_EXISTS")) throw err;
  }
}

function ensureTimer(ycBin, triggerName, cron, fnName, saId) {
  try {
    ycText(ycBin, ["serverless", "trigger", "get", "--name", triggerName]);
  } catch {
    ycText(ycBin, [
      "serverless",
      "trigger",
      "create",
      "timer",
      triggerName,
      "--cron-expression",
      cron,
      "--invoke-function-name",
      fnName,
      "--invoke-function-tag",
      "$latest",
      "--invoke-function-service-account-id",
      saId,
    ]);
  }
}

function deleteTimerIfExists(ycBin, triggerName) {
  try {
    ycText(ycBin, ["serverless", "trigger", "delete", "--name", triggerName]);
    console.log(`[deploy] deleted timer ${triggerName}`);
  } catch {
    /* absent */
  }
}

function allowPublicInvoke(ycBin, name) {
  try {
    ycText(ycBin, [
      "serverless",
      "function",
      "allow-unauthenticated-invoke",
      name,
    ]);
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("already")) console.warn(`[deploy] public invoke: ${msg}`);
  }
}

async function main() {
  const ycBin = findYc();
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

  const jar = loadMosEnrolledCookies(ROOT);
  if (Object.keys(jar).length > 0) {
    await saveCookiesToS3(jar);
    console.log("[deploy] optional cookies uploaded to S3");
  } else {
    console.log(
      "[deploy] no secret/mos-enrolled-sync.cookies.json — sync uses public API",
    );
  }

  const saId = ensureSa(ycBin);
  const cronSecret =
    process.env.MOS_CONTROLLER_CRON_SECRET?.trim() ||
    crypto.randomBytes(24).toString("base64url");
  const cronSecretFile = path.join(ROOT, "secret", "mos-controller-cron.secret.txt");
  fs.mkdirSync(path.dirname(cronSecretFile), { recursive: true });
  fs.writeFileSync(
    cronSecretFile,
    `# gitignored — GitHub secret MOS_CONTROLLER_CRON_SECRET\n${cronSecret}\n`,
    "utf8",
  );

  console.log("[deploy] staging bm-mos-enrolled-sync…");
  const syncZip = stageSyncApp();
  ensureFunction(ycBin, SYNC_NAME);
  const syncPkg = uploadZip(ycBin, syncZip, SYNC_NAME);
  const syncUrl = functionUrl(ycBin, SYNC_NAME);
  deployVersion(ycBin, SYNC_NAME, syncPkg, saId, buildSyncEnv(syncUrl), "300s", "index.handler", {
    saId,
    retries: 3,
  });
  ensureInvoker(ycBin, SYNC_NAME, saId);
  deleteTimerIfExists(ycBin, SYNC_TIMER);

  console.log("[deploy] staging bm-schedule-traffic…");
  const trafficZip = stageSimpleApp(TRAFFIC_APP, [
    ...YCF_S3_LIB_FILES,
    "schedule-traffic.mjs",
  ]);
  ensureFunction(ycBin, TRAFFIC_NAME);
  const trafficPkg = uploadZip(ycBin, trafficZip, TRAFFIC_NAME);
  deployVersion(ycBin, TRAFFIC_NAME, trafficPkg, saId, buildTrafficEnv(), "30s");
  allowPublicInvoke(ycBin, TRAFFIC_NAME);
  const trafficUrl = functionUrl(ycBin, TRAFFIC_NAME);

  console.log("[deploy] staging bm-mos-sync-controller…");
  const controllerZip = stageSimpleApp(CONTROLLER_APP, [
    ...YCF_S3_LIB_FILES,
    "mos-sync-debug.mjs",
    "mos-sync-trace.mjs",
    "schedule-traffic.mjs",
    "mos-sync-state.mjs",
    "mos-sync-invoke.mjs",
    "mos-sync-controller.mjs",
    "mos-sync-controller-pipeline.mjs",
    "mos-sync-failure-alert.mjs",
  ]);
  ensureFunction(ycBin, CONTROLLER_NAME);
  const controllerPkg = uploadZip(ycBin, controllerZip, CONTROLLER_NAME);
  const controllerUrl = functionUrl(ycBin, CONTROLLER_NAME);
  deployVersion(
    ycBin,
    CONTROLLER_NAME,
    controllerPkg,
    saId,
    buildControllerEnv(syncUrl, cronSecret),
    "180s",
  );
  allowPublicInvoke(ycBin, CONTROLLER_NAME);
  try {
    ensureTimer(ycBin, CONTROLLER_TIMER, "0/2 * * * ? *", CONTROLLER_NAME, saId);
  } catch (err) {
    console.warn(
      `[deploy] timer create failed (${err.message || err}) — use .github/workflows/mos-sync-controller.yml`,
    );
  }
  ensureInvoker(ycBin, SYNC_NAME, saId);

  const out = path.join(ROOT, "secret", "mos-sync-adaptive.deploy.txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    `# Adaptive mos sync — gitignored
SYNC_URL=${syncUrl}
TRAFFIC_URL=${trafficUrl}
CONTROLLER_URL=${controllerUrl}
CONTROLLER_TIMER=0/2 * * * ? *
# apps/web (local + Timeweb build):
NEXT_PUBLIC_SCHEDULE_PULSE_URL=${trafficUrl}
# GitHub: node scripts/setup-github-mos-sync-controller.mjs
# GHA mos-enrolled-sync cron OFF; mos-sync-controller.yml every 2m
`,
    "utf8",
  );
  console.log(`[deploy] SYNC_URL=${syncUrl}`);
  console.log(`[deploy] TRAFFIC_URL=${trafficUrl}`);
  console.log(`[deploy] CONTROLLER_URL=${controllerUrl}`);
  console.log(`[deploy] wrote ${path.relative(ROOT, out)}`);
  console.log(`[deploy] wrote ${path.relative(ROOT, cronSecretFile)}`);
}

main().catch((e) => {
  console.error("[deploy]", e.message || e);
  process.exit(1);
});
