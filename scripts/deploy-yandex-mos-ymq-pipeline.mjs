#!/usr/bin/env node
/**
 * Deploy YMQ MOS pipeline: planner, url-worker (+ YMQ trigger), finalizer.
 *
 *   node scripts/deploy-yandex-mos-ymq-pipeline.mjs
 *   make deploy-yandex-mos-ymq-pipeline
 *
 * Prerequisite: node scripts/provision-mos-ymq.mjs (queues + MOS_YMQ_QUEUE_URL in secret)
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import { DEFAULT_COOKIES_S3_KEY } from "./lib/mos-enrolled-cookie-store.mjs";
import { S3_YC_ENDPOINT, S3_YC_REGION } from "./lib/s3-storage.mjs";
import { stageMosLibs } from "./lib/ycf-stage-mos-libs.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVICE_ACCOUNT_NAME = "bm-mos-enrolled-sync-sa";
const RUNTIME = "nodejs22";
const YCF_PACKAGE_BUCKET = process.env.YCF_PACKAGE_BUCKET?.trim() || "bm-questhub";

const APPS = [
  {
    name: "bm-mos-sync-planner",
    dir: "yandex-mos-sync-planner",
    entrypoint: "index.handler",
    timeout: "120s",
    memory: "256m",
    asyncSa: true,
  },
  {
    name: "bm-mos-url-worker",
    dir: "yandex-mos-url-worker",
    entrypoint: "index.handler",
    timeout: "120s",
    memory: "256m",
    ymqTrigger: "bm-mos-url-worker-ymq",
  },
  {
    name: "bm-mos-sync-finalizer",
    dir: "yandex-mos-sync-finalizer",
    entrypoint: "index.handler",
    timeout: "300s",
    memory: "256m",
    asyncSa: true,
  },
];

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
    throw new Error(`yc ${args.join(" ")}\n${r.stderr || r.stdout}`);
  }
  return (r.stdout || "").trim();
}

function readGoogleSaBase64() {
  loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (b64) return b64;
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing");
  return Buffer.from(inline, "utf8").toString("base64");
}

function readYmqEnv() {
  loadDotEnv(path.join(ROOT, "secret", "mos-ymq.deploy.txt"));
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  const queueUrl = process.env.MOS_YMQ_QUEUE_URL?.trim();
  const queueArn = process.env.MOS_YMQ_QUEUE_ARN?.trim();
  if (!queueUrl) {
    throw new Error("MOS_YMQ_QUEUE_URL missing — run: node scripts/provision-mos-ymq.mjs");
  }
  return { queueUrl, queueArn };
}

function baseEnvPairs() {
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  const hotId =
    process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
    "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";
  const pairs = {
    GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: readGoogleSaBase64(),
    GOOGLE_SHEETS_HOT_SPREADSHEET_ID: hotId,
    GOOGLE_SHEETS_HOT_RANGE_FORMATS: "'Форматы'!A:AZ",
    MOS_ENROLLED_COOKIES_S3_KEY: DEFAULT_COOKIES_S3_KEY,
    MOS_ENROLLED_SKIP_LOCAL_COOKIE_WRITE: "1",
    MOS_ENROLLED_SKIP_S3_COOKIES: "1",
    MOS_ENROLLED_URL_DELAY_MS: process.env.MOS_ENROLLED_URL_DELAY_MS?.trim() || "500",
    MOS_ENROLLED_FETCH_TIMEOUT_MS:
      process.env.MOS_ENROLLED_FETCH_TIMEOUT_MS?.trim() || "15000",
    MOS_ENROLLED_FETCH_CONCURRENCY:
      process.env.MOS_ENROLLED_FETCH_CONCURRENCY?.trim() || "2",
    MOS_ENROLLED_BATCH_SIZE: process.env.MOS_ENROLLED_BATCH_SIZE?.trim() || "4",
    MOS_ENROLLED_WORKER_TIMEOUT_MS:
      process.env.MOS_ENROLLED_WORKER_TIMEOUT_MS?.trim() || "120000",
    MOS_ENROLLED_BATCH_BUDGET_MS:
      process.env.MOS_ENROLLED_BATCH_BUDGET_MS?.trim() || "105000",
    MOS_SYNC_PIPELINE: "ymq",
    MOS_SYNC_USE_PID: "1",
    MOS_OPS_S3_TIMEOUT_MS: process.env.MOS_OPS_S3_TIMEOUT_MS?.trim() || "30000",
    S3_BUCKET: process.env.S3_BUCKET?.trim() || "",
    S3_ENDPOINT: process.env.S3_ENDPOINT?.trim() || S3_YC_ENDPOINT,
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION?.trim() || S3_YC_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
  };
  const tgToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const tgChat = process.env.TELEGRAM_CHAT_ID?.trim();
  if (tgToken && tgChat) {
    pairs.TELEGRAM_BOT_TOKEN = tgToken;
    pairs.TELEGRAM_CHAT_ID = tgChat;
  }
  const ghToken =
    process.env.CONTENT_REBUILD_GITHUB_TOKEN?.trim() ||
    (fs.existsSync(path.join(ROOT, "secret", "github.token"))
      ? fs.readFileSync(path.join(ROOT, "secret", "github.token"), "utf8").trim()
      : "");
  if (ghToken) {
    pairs.CONTENT_REBUILD_GITHUB_TOKEN = ghToken;
    pairs.CONTENT_REBUILD_REPOSITORY =
      process.env.CONTENT_REBUILD_REPOSITORY?.trim() || "Brain-Master/BM_QuestHub";
    pairs.MOS_ENROLLED_AUTO_PUBLISH =
      process.env.MOS_ENROLLED_AUTO_PUBLISH?.trim() || "1";
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

function zipApp(appDir) {
  const mjs = fs.readdirSync(appDir).filter((n) => n.endsWith(".mjs"));
  const zipPath = path.join(appDir, "function.zip");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  const items = ["index.js", "package.json", "package-lock.json", ...mjs, "node_modules"];
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

function ensureFunction(ycBin, name) {
  try {
    yc(ycBin, ["serverless", "function", "get", "--name", name]);
  } catch {
    yc(ycBin, ["serverless", "function", "create", "--name", name]);
    console.log(`[deploy] created function ${name}`);
  }
}

function ensureInvoker(ycBin, functionName, serviceAccountId) {
  try {
    ycText(ycBin, [
      "serverless",
      "function",
      "add-access-binding",
      "--name",
      functionName,
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

function uploadPackage(ycBin, zipPath, functionName) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const object = `ycf/${functionName}/function-${stamp}.zip`;
  const uri = `s3://${YCF_PACKAGE_BUCKET}/${object}`;
  ycText(ycBin, ["storage", "s3", "cp", zipPath, uri]);
  const sha256 = crypto
    .createHash("sha256")
    .update(fs.readFileSync(zipPath))
    .digest("hex");
  return { bucket: YCF_PACKAGE_BUCKET, object, sha256 };
}

function deployOne(ycBin, spec, serviceAccountId, envPairs) {
  const appDir = path.join(ROOT, "apps", spec.dir);
  stageMosLibs(appDir, ROOT);
  const npm = spawnSync("npm", ["install", "--omit=dev"], {
    cwd: appDir,
    stdio: "inherit",
    shell: true,
  });
  if (npm.status !== 0) throw new Error(`npm install failed: ${spec.dir}`);

  ensureFunction(ycBin, spec.name);
  ensureInvoker(ycBin, spec.name, serviceAccountId);

  const zipPath = zipApp(appDir);
  const pkg = uploadPackage(ycBin, zipPath, spec.name);

  const versionArgs = [
    "serverless",
    "function",
    "version",
    "create",
    "--function-name",
    spec.name,
    "--runtime",
    RUNTIME,
    "--entrypoint",
    spec.entrypoint,
    "--memory",
    spec.memory,
    "--execution-timeout",
    spec.timeout,
    "--service-account-id",
    serviceAccountId,
    "--package-bucket-name",
    pkg.bucket,
    "--package-object-name",
    pkg.object,
    "--package-sha256",
    pkg.sha256,
    ...envArgs(envPairs),
  ];

  if (spec.asyncSa) {
    versionArgs.push("--async-service-account-id", serviceAccountId);
  }

  ycText(ycBin, versionArgs);
  const fn = yc(ycBin, ["serverless", "function", "get", "--name", spec.name]);
  return `https://functions.yandexcloud.net/${fn.id}`;
}

function ensureYmqTrigger(ycBin, spec, serviceAccountId, queueArn) {
  if (!spec.ymqTrigger || !queueArn) return;
  try {
    ycText(ycBin, ["serverless", "trigger", "get", "--name", spec.ymqTrigger]);
    console.log(`[deploy] YMQ trigger ${spec.ymqTrigger} exists`);
    return;
  } catch {
    /* create */
  }
  ycText(ycBin, [
    "serverless",
    "trigger",
    "create",
    "message-queue",
    spec.ymqTrigger,
    "--queue",
    queueArn,
    "--queue-service-account-id",
    serviceAccountId,
    "--invoke-function-name",
    spec.name,
    "--invoke-function-tag",
    "$latest",
    "--batch-size",
    "1",
    "--invoke-function-service-account-id",
    serviceAccountId,
  ]);
  console.log(`[deploy] created YMQ trigger ${spec.ymqTrigger}`);
}

async function main() {
  const ycBin = findYc();
  const { queueUrl, queueArn } = readYmqEnv();
  const sa = yc(ycBin, ["iam", "service-account", "get", "--name", SERVICE_ACCOUNT_NAME]);
  const base = baseEnvPairs();
  base.MOS_YMQ_QUEUE_URL = queueUrl;

  /** @type {Record<string, string>} */
  const urls = {};

  for (const spec of APPS) {
    const pairs = { ...base };
    if (spec.name === "bm-mos-sync-finalizer") {
      pairs.MOS_ENROLLED_AUTO_PUBLISH =
        process.env.MOS_ENROLLED_AUTO_PUBLISH?.trim() || "1";
    }
    console.log(`\n[deploy] ${spec.name} …`);
    urls[spec.name] = deployOne(ycBin, spec, sa.id, pairs);
    if (spec.ymqTrigger) {
      ensureYmqTrigger(ycBin, spec, sa.id, queueArn);
    }
  }

  const out = path.join(ROOT, "secret", "mos-ymq-pipeline.deploy.txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    `# YMQ MOS pipeline — gitignored
MOS_YMQ_QUEUE_URL=${queueUrl}
MOS_SYNC_PLANNER_FUNCTION_URL=${urls["bm-mos-sync-planner"]}
MOS_SYNC_FINALIZER_FUNCTION_URL=${urls["bm-mos-sync-finalizer"]}
# Worker: ${urls["bm-mos-url-worker"]} (YMQ trigger, not HTTP from controller)
`,
    "utf8",
  );

  console.log(`\n[deploy] wrote ${path.relative(ROOT, out)}`);
  console.log("[deploy] next: redeploy controller with MOS_SYNC_PIPELINE=ymq");
  console.log("         make redeploy-yandex-mos-sync-controller");
}

main().catch((e) => {
  console.error("[deploy]", e.message || e);
  process.exit(1);
});
