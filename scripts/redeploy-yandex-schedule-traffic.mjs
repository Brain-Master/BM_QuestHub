#!/usr/bin/env node
/** Redeploy bm-schedule-traffic (lib/timeout). */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv, loadS3Env } from "./load-dotenv.mjs";
import { S3_YC_ENDPOINT, S3_YC_REGION } from "./lib/s3-storage.mjs";
import {
  assertYcfS3LibsPresent,
  YCF_S3_LIB_FILES,
} from "./lib/ycf-s3-lib-files.mjs";

const ROOT = loadRepoEnv();
const LIB = path.join(ROOT, "scripts", "lib");
const APP = path.join(ROOT, "apps", "yandex-schedule-traffic");
const NAME = "bm-schedule-traffic";
const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");

function ycText(args) {
  const r = spawnSync(YC, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return (r.stdout || "").trim();
}

function yc(args) {
  const r = spawnSync(YC, [...args, "--format", "json"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return JSON.parse(r.stdout || "{}");
}

function main() {
  loadS3Env();
  for (const name of fs.readdirSync(APP)) {
    if (name.endsWith(".mjs") && name !== "index.js") fs.unlinkSync(path.join(APP, name));
  }
  for (const name of [...YCF_S3_LIB_FILES, "schedule-traffic.mjs"]) {
    fs.copyFileSync(path.join(LIB, name), path.join(APP, name));
  }
  assertYcfS3LibsPresent(APP);
  spawnSync("npm", ["install", "--omit=dev"], { cwd: APP, stdio: "inherit", shell: true });
  const mjs = fs.readdirSync(APP).filter((n) => n.endsWith(".mjs") && n !== "index.js");
  const zip = path.join(APP, "function.zip");
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
  const items = [...mjs, "index.js", "package.json", "package-lock.json", "node_modules"];
  spawnSync(
    "powershell",
    ["-NoProfile", "-Command", `Compress-Archive -Path ${items.map((i) => `'${i}'`).join(",")} -DestinationPath 'function.zip' -Force`],
    { cwd: APP, stdio: "inherit", shell: true },
  );
  const bucket = process.env.YCF_PACKAGE_BUCKET?.trim() || "bm-questhub";
  const object = `ycf/${NAME}/function-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
  ycText(["storage", "s3", "cp", zip, `s3://${bucket}/${object}`]);
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(zip)).digest("hex");
  const sa = yc(["iam", "service-account", "get", "--name", "bm-mos-enrolled-sync-sa"]);
  const env = [
    "ALLOWED_ORIGINS=https://quest.b-master.pro,https://www.quest.b-master.pro,http://localhost:3000",
    `S3_BUCKET=${process.env.S3_BUCKET}`,
    `S3_ENDPOINT=${process.env.S3_ENDPOINT || S3_YC_ENDPOINT}`,
    `AWS_DEFAULT_REGION=${process.env.AWS_DEFAULT_REGION || S3_YC_REGION}`,
    `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
    `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
    "MOS_OPS_S3_TIMEOUT_MS=30000",
    "SCHEDULE_PULSE_S3_TIMEOUT_MS=12000",
  ].flatMap((e) => ["--environment", e]);
  ycText([
    "serverless", "function", "version", "create",
    "--function-name", NAME,
    "--runtime", "nodejs22",
    "--entrypoint", "index.handler",
    "--memory", "256m",
    "--execution-timeout", "60s",
    "--service-account-id", sa.id,
    "--package-bucket-name", bucket,
    "--package-object-name", object,
    "--package-sha256", sha256,
    ...env,
  ]);
  try {
    ycText(["serverless", "function", "allow-unauthenticated-invoke", NAME]);
  } catch { /* */ }
  console.log(`[redeploy] ${NAME} ok`);
}

main();
