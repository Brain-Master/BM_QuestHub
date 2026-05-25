#!/usr/bin/env node
/** Redeploy only bm-mos-sync-controller after lib/handler changes. */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(ROOT, "scripts", "lib");
const APP = path.join(ROOT, "apps", "yandex-mos-sync-controller");
const SYNC_NAME = "bm-mos-enrolled-sync";
const CONTROLLER_NAME = "bm-mos-sync-controller";

const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");

function yc(args) {
  const r = spawnSync(YC, [...args, "--format", "json"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return JSON.parse(r.stdout || "{}");
}

function ycText(args) {
  const r = spawnSync(YC, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return (r.stdout || "").trim();
}

function copyLibs() {
  for (const name of fs.readdirSync(APP)) {
    if (name.endsWith(".mjs") && name !== "index.js") fs.unlinkSync(path.join(APP, name));
  }
  for (const name of [
    "mos-ops-s3.mjs",
    "mos-sync-debug.mjs",
    "mos-sync-trace.mjs",
    "schedule-traffic.mjs",
    "mos-sync-state.mjs",
    "mos-sync-invoke.mjs",
    "mos-sync-controller.mjs",
  ]) {
    fs.copyFileSync(path.join(LIB, name), path.join(APP, name));
  }
}

function main() {
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  const secretPath = path.join(ROOT, "secret", "mos-controller-cron.secret.txt");
  let cronSecret = process.env.MOS_CONTROLLER_CRON_SECRET?.trim();
  if (!cronSecret && fs.existsSync(secretPath)) {
    cronSecret = fs
      .readFileSync(secretPath, "utf8")
      .split("\n")
      .find((l) => l.trim() && !l.startsWith("#"))
      ?.trim();
  }
  if (!cronSecret) cronSecret = crypto.randomBytes(24).toString("base64url");

  copyLibs();
  spawnSync("npm", ["install", "--omit=dev"], { cwd: APP, stdio: "inherit", shell: true });

  const mjs = fs.readdirSync(APP).filter((n) => n.endsWith(".mjs") && n !== "index.js");
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

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const object = `ycf/${CONTROLLER_NAME}/function-${stamp}.zip`;
  const bucket = process.env.YCF_PACKAGE_BUCKET?.trim() || "bm-questhub";
  ycText(["storage", "s3", "cp", zip, `s3://${bucket}/${object}`]);
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(zip)).digest("hex");

  const syncFn = yc(["serverless", "function", "get", "--name", SYNC_NAME]);
  const syncUrl = `https://functions.yandexcloud.net/${syncFn.id}`;
  const sa = yc(["iam", "service-account", "get", "--name", "bm-mos-enrolled-sync-sa"]);

  const env = [
    `MOS_ENROLLED_SYNC_FUNCTION_URL=${syncUrl}`,
    `MOS_CONTROLLER_CRON_SECRET=${cronSecret}`,
    `S3_BUCKET=${process.env.S3_BUCKET}`,
    `S3_ENDPOINT=${process.env.S3_ENDPOINT || "https://s3.twcstorage.ru"}`,
    `AWS_DEFAULT_REGION=${process.env.AWS_DEFAULT_REGION || "ru-1"}`,
    `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
    `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
    "MOS_SYNC_USE_PID=1",
    "MOS_OPS_S3_TIMEOUT_MS=30000",
  ].flatMap((e) => ["--environment", e]);

  ycText([
    "serverless",
    "function",
    "version",
    "create",
    "--function-name",
    CONTROLLER_NAME,
    "--runtime",
    "nodejs22",
    "--entrypoint",
    "index.handler",
    "--memory",
    "256m",
    "--execution-timeout",
    "180s",
    "--service-account-id",
    sa.id,
    "--package-bucket-name",
    bucket,
    "--package-object-name",
    object,
    "--package-sha256",
    sha256,
    ...env,
  ]);

  try {
    ycText(["serverless", "function", "allow-unauthenticated-invoke", CONTROLLER_NAME]);
  } catch {
    /* already */
  }

  const controllerFn = yc(["serverless", "function", "get", "--name", CONTROLLER_NAME]);
  const controllerUrl = `https://functions.yandexcloud.net/${controllerFn.id}`;
  fs.writeFileSync(
    secretPath,
    `# gitignored — GitHub secret MOS_CONTROLLER_CRON_SECRET\n${cronSecret}\n`,
    "utf8",
  );
  console.log(`[redeploy] ${controllerUrl}`);
  console.log(`[redeploy] cron secret → ${path.relative(ROOT, secretPath)}`);
}

main();
