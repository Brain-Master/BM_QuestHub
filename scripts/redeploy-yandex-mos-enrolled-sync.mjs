#!/usr/bin/env node
/** Redeploy only bm-mos-enrolled-sync after lib/handler changes. */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import { readTelegramEnv } from "./lib/read-ycf-telegram-env.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(ROOT, "scripts", "lib");
const SYNC_APP = path.join(ROOT, "apps", "yandex-mos-enrolled-sync");
const SYNC_NAME = "bm-mos-enrolled-sync";
const DEFAULT_COOKIES_S3_KEY = "ops/mos-enrolled-sync.cookies.json";

const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");

function ycEnv() {
  const token = process.env.YC_TOKEN?.trim() || process.env.YC_IAM_TOKEN?.trim();
  return token ? { ...process.env, YC_TOKEN: token } : process.env;
}

function yc(args) {
  const r = spawnSync(YC, [...args, "--format", "json"], {
    encoding: "utf8",
    env: ycEnv(),
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return JSON.parse(r.stdout || "{}");
}

function ycText(args) {
  const r = spawnSync(YC, args, { encoding: "utf8", env: ycEnv() });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return (r.stdout || "").trim();
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
  if (!inline) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing in scripts/sheets.env");
  return Buffer.from(inline, "utf8").toString("base64");
}

function stageSyncApp() {
  const bundledDir = path.join(SYNC_APP, "bundled", "bm-mos-enrolled-sync");
  fs.mkdirSync(bundledDir, { recursive: true });
  for (const name of fs.readdirSync(bundledDir)) {
    if (name.endsWith(".mjs")) fs.unlinkSync(path.join(bundledDir, name));
  }
  for (const name of fs.readdirSync(SYNC_APP)) {
    if (name.endsWith(".mjs") && name !== "index.js") {
      fs.unlinkSync(path.join(SYNC_APP, name));
    }
  }
  const syncLibs = fs
    .readdirSync(LIB)
    .filter(
      (n) =>
        n.endsWith(".mjs") &&
        !n.endsWith(".test.mjs") &&
        (n.startsWith("mos-enrolled") ||
          n.startsWith("mos-ops-") ||
          n.startsWith("mos-sync-") ||
          n.startsWith("schedule-traffic") ||
          n.startsWith("trigger-sheet") ||
          n === "telegram-alert.mjs"),
    );
  for (const name of syncLibs) {
    fs.copyFileSync(path.join(LIB, name), path.join(bundledDir, name));
    fs.copyFileSync(path.join(LIB, name), path.join(SYNC_APP, name));
  }
  spawnSync("npm", ["install", "--omit=dev"], { cwd: SYNC_APP, stdio: "inherit", shell: true });
  const linked = path.join(SYNC_APP, "node_modules", "bm-mos-enrolled-sync");
  fs.rmSync(linked, { recursive: true, force: true });
  fs.cpSync(bundledDir, linked, { recursive: true });
  const mjs = fs.readdirSync(SYNC_APP).filter((n) => n.endsWith(".mjs"));
  const zip = path.join(SYNC_APP, "function.zip");
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
  const items = [...mjs, "index.js", "package.json", "package-lock.json", "node_modules"];
  spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path ${items.map((i) => `'${i}'`).join(",")} -DestinationPath 'function.zip' -Force`,
    ],
    { cwd: SYNC_APP,
      stdio: "inherit",
      shell: true },
  );
  return zip;
}

function writeManualDeployHint({ bucket, object, sha256, saId, err }) {
  const out = path.join(ROOT, "secret", "mos-enrolled-sync-manual-deploy.txt");
  const body = `# bm-mos-enrolled-sync — ручной деплой (yc PermissionDenied)

Ошибка: ${String(err).split("\n")[0]}

ZIP локально: apps/yandex-mos-enrolled-sync/function.zip
S3: s3://${bucket}/${object}
SHA256: ${sha256}

1. yc init — аккаунт с ролью editor/admin на folder b1gspr48onc7vlv9elco
   или: $env:YC_TOKEN="<IAM-токен с правами>" ; node scripts/redeploy-yandex-mos-enrolled-sync.mjs

2. Консоль Yandex Cloud → Cloud Functions → bm-mos-enrolled-sync → Создать версию:
   - Пакет из S3: bucket ${bucket}, object ${object}
   - Timeout: 300s
   - Async: service account ${saId}, retries 3
   - Entry: index.handler, runtime nodejs22

3. node scripts/check-mos-sync-async.mjs — async_sa не MISSING
`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, body, "utf8");
  console.error(`[redeploy] wrote ${path.relative(ROOT, out)}`);
}

function main() {
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));

  let bucket = "";
  let object = "";
  let sha256 = "";
  let saId = "";

  try {
    const zip = stageSyncApp();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    object = `ycf/${SYNC_NAME}/function-${stamp}.zip`;
    bucket = process.env.YCF_PACKAGE_BUCKET?.trim() || "bm-questhub";
    ycText(["storage", "s3", "cp", zip, `s3://${bucket}/${object}`]);
    sha256 = crypto.createHash("sha256").update(fs.readFileSync(zip)).digest("hex");

    const saIdFromEnv = process.env.MOS_SYNC_SA_ID?.trim();
    if (saIdFromEnv) {
      saId = saIdFromEnv;
    } else {
      const sa = yc(["iam", "service-account", "get", "--name", "bm-mos-enrolled-sync-sa"]);
      saId = sa.id;
    }
    deployVersionBody({ bucket, object, sha256, sa: { id: saId } });
    const fn = yc(["serverless", "function", "get", "--name", SYNC_NAME]);
    console.log(`[redeploy] https://functions.yandexcloud.net/${fn.id}`);
  } catch (err) {
    if (String(err).includes("PermissionDenied") || String(err).includes("permission denied")) {
      writeManualDeployHint({ bucket, object, sha256, saId, err });
      console.error(
        "[redeploy] Нет прав на CreateVersion. Обновите yc (yc init) или задеплойте версию из консоли — см. secret/mos-enrolled-sync-manual-deploy.txt",
      );
      process.exit(1);
    }
    throw err;
  }
}

function deployVersionBody({ bucket, object, sha256, sa }) {
  const hotId =
    process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
    "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";

  const env = [
    `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=${readGoogleSaBase64()}`,
    `GOOGLE_SHEETS_HOT_SPREADSHEET_ID=${hotId}`,
    "GOOGLE_SHEETS_HOT_RANGE_GROUPS='Группы'!A:AZ",
    "GOOGLE_SHEETS_HOT_RANGE_FORMATS='Форматы'!A:AZ",
    `MOS_ENROLLED_COOKIES_S3_KEY=${DEFAULT_COOKIES_S3_KEY}`,
    "MOS_ENROLLED_SKIP_LOCAL_COOKIE_WRITE=1",
    "MOS_ENROLLED_URL_DELAY_MS=200",
    "MOS_ENROLLED_FETCH_CONCURRENCY=4",
    "MOS_ENROLLED_FETCH_TIMEOUT_MS=15000",
    "MOS_ENROLLED_SKIP_S3_COOKIES=1",
    `MOS_ENROLLED_AUTO_PUBLISH=${process.env.MOS_ENROLLED_AUTO_PUBLISH?.trim() || "1"}`,
    `MOS_ENROLLED_TG_ENABLED=${process.env.MOS_ENROLLED_TG_ENABLED?.trim() || "1"}`,
    `S3_BUCKET=${process.env.S3_BUCKET}`,
    `S3_ENDPOINT=${process.env.S3_ENDPOINT || "https://s3.twcstorage.ru"}`,
    `AWS_DEFAULT_REGION=${process.env.AWS_DEFAULT_REGION || "ru-1"}`,
    `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
    `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
    "MOS_SYNC_USE_PID=1",
    "MOS_OPS_S3_TIMEOUT_MS=15000",
  ];

  const tg = readTelegramEnv({ root: ROOT, ycBin: YC });
  if (tg) {
    env.push(`TELEGRAM_BOT_TOKEN=${tg.TELEGRAM_BOT_TOKEN}`, `TELEGRAM_CHAT_ID=${tg.TELEGRAM_CHAT_ID}`);
    console.log(`[redeploy] Telegram from ${tg.source}`);
  } else {
    console.warn("[redeploy] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not found — alerts disabled");
  }
  const ghToken = readGithubToken();
  if (ghToken) {
    env.push(
      `CONTENT_REBUILD_GITHUB_TOKEN=${ghToken}`,
      `CONTENT_REBUILD_REPOSITORY=${process.env.CONTENT_REBUILD_REPOSITORY?.trim() || "Brain-Master/BM_QuestHub"}`,
      `SHEET_SYNC_WORKFLOW=${process.env.SHEET_SYNC_WORKFLOW?.trim() || "sheet-sync.yml"}`,
    );
    console.log("[redeploy] CONTENT_REBUILD_GITHUB_TOKEN set (env or secret/github.token)");
  }

  const envArgs = env.flatMap((e) => ["--environment", e]);

  ycText([
    "serverless",
    "function",
    "version",
    "create",
    "--function-name",
    SYNC_NAME,
    "--runtime",
    "nodejs22",
    "--entrypoint",
    "index.handler",
    "--memory",
    "256m",
    "--execution-timeout",
    "300s",
    "--async-max-retries",
    "3",
    "--async-service-account-id",
    sa.id,
    "--service-account-id",
    sa.id,
    "--package-bucket-name",
    bucket,
    "--package-object-name",
    object,
    "--package-sha256",
    sha256,
    ...envArgs,
  ]);
}

main();
