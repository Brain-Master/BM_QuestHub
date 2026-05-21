#!/usr/bin/env node
/**
 * End-to-end ops stack verification (local + cloud smoke).
 *
 *   node scripts/ops-verify-all.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();

function readLine(fileRel, key) {
  const p = path.join(ROOT, fileRel);
  if (!fs.existsSync(p)) return "";
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) return line.slice(key.length + 1).trim();
  }
  return "";
}

function run(label, cmd, args, options = {}) {
  console.log(`\n[verify] ${label}`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    stdio: "inherit",
    ...options,
  });
  if (r.status !== 0) {
    throw new Error(`${label} failed (exit ${r.status})`);
  }
}

async function smokeOps() {
  const url = readLine("secret/ops-reporter.deploy.txt", "OPS_REPORT_URL");
  const token = fs.readFileSync(path.join(ROOT, "secret/ops-reporter.token"), "utf8").trim();
  const requestId = `verify-all-${Date.now()}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ops-token": token,
      origin: "https://quest.b-master.pro",
    },
    body: JSON.stringify({
      event: "lead.client_submit_failed",
      source: "bm-questhub-static",
      occurredAt: new Date().toISOString(),
      errorCode: "delivery_failed",
      errorMessage: "Проверка ops-verify-all: тестовое сообщение",
      requestId,
      lead: { parentName: "Тест", contact: "+79990000001", questTitle: "Verify" },
    }),
  });
  const text = await res.text();
  console.log(`[verify] ops smoke → ${res.status} ${text}`);
  if (!res.ok) throw new Error(`ops smoke failed: ${text}`);
}

async function checkProdBundle() {
  const r = spawnSync(process.execPath, ["scripts/check-prod-ops-bundle.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (r.status === 0) {
    console.log("[verify] prod bundle includes ops reporter URL");
  } else {
    throw new Error("prod bundle missing ops reporter URL — redeploy static site");
  }
}

async function main() {
  run("unit tests (ops-reporter)", process.execPath, ["--test"], {
    cwd: path.join(ROOT, "apps/yandex-lead-ops-reporter"),
  });

  process.env.OPS_REPORT_URL = readLine("secret/ops-reporter.deploy.txt", "OPS_REPORT_URL");
  process.env.OPS_REPORT_TOKEN = fs
    .readFileSync(path.join(ROOT, "secret/ops-reporter.token"), "utf8")
    .trim();

  run("site health check", process.execPath, ["scripts/site-health-check.mjs"]);
  await smokeOps();
  await checkProdBundle();

  console.log("\n[verify] all checks passed");
}

main().catch((err) => {
  console.error("[verify]", err.message || err);
  process.exit(1);
});
