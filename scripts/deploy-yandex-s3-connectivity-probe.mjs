#!/usr/bin/env node
/** Deploy YCF bm-s3-connectivity-probe (S3 latency probe + Telegram). */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv, loadS3Env } from "./load-dotenv.mjs";
import { publicBaseUrlForBucket } from "./lib/s3-storage.mjs";
import { readTelegramEnv } from "./lib/read-ycf-telegram-env.mjs";

const ROOT = loadRepoEnv();
const LIB = path.join(ROOT, "scripts", "lib");
const APP = path.join(ROOT, "apps", "yandex-s3-connectivity-probe");
const NAME = "bm-s3-connectivity-probe";
const SA_NAME = "bm-mos-enrolled-sync-sa";
const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");

const COPY_LIBS = [
  "mos-ops-s3.mjs",
  "mos-sync-debug.mjs",
  "s3-connectivity-probe.mjs",
  "s3-storage.mjs",
  "telegram-alert.mjs",
];

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

function functionExists(name) {
  try {
    yc(["serverless", "function", "get", "--name", name]);
    return true;
  } catch {
    return false;
  }
}

function stageApp() {
  for (const name of fs.readdirSync(APP)) {
    if (name.endsWith(".mjs") && name !== "index.js") {
      fs.unlinkSync(path.join(APP, name));
    }
  }
  for (const name of COPY_LIBS) {
    fs.copyFileSync(path.join(LIB, name), path.join(APP, name));
  }
  spawnSync("npm", ["install", "--omit=dev"], { cwd: APP, stdio: "inherit", shell: true });
  const mjs = fs.readdirSync(APP).filter((n) => n.endsWith(".mjs"));
  const zip = path.join(APP, "function.zip");
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
  const items = [...mjs, "index.js", "package.json", "package-lock.json", "node_modules"];
  spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path ${items.map((i) => `'${i}'`).join(",")} -DestinationPath 'function.zip' -Force`,
    ],
    { cwd: APP, stdio: "inherit", shell: true },
  );
  return zip;
}

function main() {
  loadS3Env();

  const zip = stageApp();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const bucket =
    process.env.YCF_PACKAGE_BUCKET?.trim() ||
    process.env.S3_LEGACY_BUCKET?.trim() ||
    "bm-questhub";
  const object = `ycf/${NAME}/function-${stamp}.zip`;
  ycText(["storage", "s3", "cp", zip, `s3://${bucket}/${object}`]);
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(zip)).digest("hex");

  const sa = yc(["iam", "service-account", "get", "--name", SA_NAME]);

  if (!functionExists(NAME)) {
    yc(["serverless", "function", "create", "--name", NAME]);
    console.log(`[deploy] created function ${NAME}`);
  }

  const env = [
    `S3_BUCKET=${process.env.S3_BUCKET}`,
    `S3_ENDPOINT=${process.env.S3_ENDPOINT || "https://s3.twcstorage.ru"}`,
    `AWS_DEFAULT_REGION=${process.env.AWS_DEFAULT_REGION || "ru-1"}`,
    `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
    `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
    `S3_PUBLIC_BASE_URL=${publicBaseUrlForBucket("hot")}`,
    "MOS_OPS_S3_TIMEOUT_MS=30000",
    "S3_PROBE_ROUNDS=3",
    "S3_PROBE_TG=1",
  ];

  const tg = readTelegramEnv({ root: ROOT, ycBin: YC });
  if (tg) {
    env.push(`TELEGRAM_BOT_TOKEN=${tg.TELEGRAM_BOT_TOKEN}`, `TELEGRAM_CHAT_ID=${tg.TELEGRAM_CHAT_ID}`);
    console.log(`[deploy] Telegram from ${tg.source}`);
  } else {
    console.warn("[deploy] TELEGRAM_* not set — probe will log only");
  }

  const envArgs = env.flatMap((e) => ["--environment", e]);

  ycText([
    "serverless",
    "function",
    "version",
    "create",
    "--function-name",
    NAME,
    "--runtime",
    "nodejs22",
    "--entrypoint",
    "index.handler",
    "--memory",
    "256m",
    "--execution-timeout",
    "120s",
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

  try {
    ycText(["serverless", "function", "allow-unauthenticated-invoke", NAME]);
  } catch {
    /* already */
  }

  const fn = yc(["serverless", "function", "get", "--name", NAME]);
  const url = `https://functions.yandexcloud.net/${fn.id}`;
  const out = path.join(ROOT, "secret", "s3-connectivity-probe.deploy.txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    `# ${NAME}
FUNCTION_URL=${url}
# Invoke:
# yc serverless function invoke --name ${NAME} --data '{"sendTelegram":true,"source":"manual"}'
`,
    "utf8",
  );
  console.log(`[deploy] ${url}`);
  console.log(`[deploy] wrote ${path.relative(ROOT, out)}`);
}

main();
