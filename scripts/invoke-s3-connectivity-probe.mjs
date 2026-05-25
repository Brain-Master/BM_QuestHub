#!/usr/bin/env node
/** Invoke bm-s3-connectivity-probe and print JSON response. */
import { spawnSync } from "node:child_process";
import path from "node:path";

const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");
const NAME = "bm-s3-connectivity-probe";

const payload = JSON.stringify({
  sendTelegram: process.env.S3_PROBE_TG?.trim() !== "0",
  source: process.argv[2]?.trim() || "cli-invoke",
  rounds: Number(process.env.S3_PROBE_ROUNDS) || 3,
});

const token = process.env.YC_TOKEN?.trim() || process.env.YC_IAM_TOKEN?.trim();
const env = token ? { ...process.env, YC_TOKEN: token } : process.env;

const r = spawnSync(
  YC,
  ["serverless", "function", "invoke", "--name", NAME, "--data", payload],
  { encoding: "utf8", env },
);

process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");
process.exit(r.status ?? 1);
