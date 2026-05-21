#!/usr/bin/env node
/**
 * Deploy apps/yandex-lead-ops-reporter to Yandex Cloud (bm-lead-ops-reporter).
 * Copies Telegram/Sheets/ALLOWED_ORIGINS from latest bm-lead-receiver version.
 * Patches bm-lead-receiver with OPS_REPORT_URL + OPS_REPORT_TOKEN.
 *
 *   node scripts/deploy-yandex-lead-ops-reporter.mjs
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const APP = path.join(ROOT, "apps", "yandex-lead-ops-reporter");
const LEAD_FUNCTION = "bm-lead-receiver";
const OPS_FUNCTION = "bm-lead-ops-reporter";
const RUNTIME = "nodejs22";
const ENTRYPOINT = "index.handler";

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

  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path 'index.js','package.json' -DestinationPath 'function.zip' -Force`,
    ],
    { cwd: APP, encoding: "utf8", shell: true },
  );
  if (ps.status !== 0) {
    throw new Error(`zip failed: ${ps.stderr || ps.stdout}`);
  }
  return zipPath;
}

function readOrCreateOpsToken() {
  const tokenPath = path.join(ROOT, "secret", "ops-reporter.token");
  if (fs.existsSync(tokenPath)) {
    return fs.readFileSync(tokenPath, "utf8").trim();
  }
  const token = crypto.randomBytes(32).toString("base64url");
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  fs.writeFileSync(tokenPath, `${token}\n`, "utf8");
  return token;
}

function mergeOrigins(leadOrigins) {
  const set = new Set(
    (leadOrigins || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  set.add("http://localhost:3000");
  return [...set].join(",");
}

function buildOpsEnv(leadEnv, opsToken) {
  const pairs = {
    ALLOWED_ORIGINS: mergeOrigins(leadEnv.ALLOWED_ORIGINS),
    OPS_REPORT_TOKEN: opsToken,
    TELEGRAM_BOT_TOKEN: leadEnv.TELEGRAM_BOT_TOKEN,
    OPS_TELEGRAM_CHAT_ID: leadEnv.TELEGRAM_CHAT_ID,
    GOOGLE_SHEETS_SPREADSHEET_ID: leadEnv.GOOGLE_SHEETS_SPREADSHEET_ID,
    // Leave empty until the Ops tab exists in the spreadsheet (see README).
    GOOGLE_OPS_SHEET_RANGE: leadEnv.GOOGLE_OPS_SHEET_RANGE || "",
    OPS_RATE_LIMIT_WINDOW_MS: leadEnv.OPS_RATE_LIMIT_WINDOW_MS || "60000",
  };

  if (leadEnv.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    pairs.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = leadEnv.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  } else if (leadEnv.GOOGLE_SERVICE_ACCOUNT_JSON) {
    pairs.GOOGLE_SERVICE_ACCOUNT_JSON = leadEnv.GOOGLE_SERVICE_ACCOUNT_JSON;
  }

  const missing = ["TELEGRAM_BOT_TOKEN", "OPS_TELEGRAM_CHAT_ID"].filter((k) => !pairs[k]);
  if (missing.length) {
    throw new Error(`lead receiver env missing: ${missing.join(", ")}`);
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

function writeDeployNotes(opsUrl, opsToken, leadVersionId) {
  const out = path.join(ROOT, "secret", "ops-reporter.deploy.txt");
  const body = `# Ops reporter — local only (secret/ is gitignored)
# YCF: ${OPS_FUNCTION}

OPS_REPORT_TOKEN=${opsToken}

OPS_REPORT_URL=${opsUrl}
NEXT_PUBLIC_OPS_REPORT_URL=${opsUrl}

# Timeweb App Platform → Environment (build-time):
#   NEXT_PUBLIC_OPS_REPORT_URL=${opsUrl}

# GitHub repo variable (content-rebuild.yml):
#   OPS_REPORT_URL=${opsUrl}

# bm-lead-receiver patched from version ${leadVersionId}
# Smoke: DevTools block lead URL → submit form → ops Telegram alert
# Optional: create Google Sheet tab "Ops" with header row (see apps/yandex-lead-ops-reporter/README.md)
`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, body, "utf8");
  console.log(`[deploy] wrote ${path.relative(ROOT, out)}`);
}

function patchLeadReceiver(bin, sourceVersionId, opsUrl, opsToken) {
  const script = path.join(ROOT, "scripts", "yandex-lead-receiver-env-patch.mjs");
  const r = spawnSync(
    process.execPath,
    [
      script,
      "--source",
      sourceVersionId,
      "--function",
      LEAD_FUNCTION,
      "--description",
      "ops-reporter URL + token",
      "--set",
      `OPS_REPORT_URL=${opsUrl}`,
      "--set",
      `OPS_REPORT_TOKEN=${opsToken}`,
    ],
    { encoding: "utf8", cwd: ROOT },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "env-patch failed");
  }
  console.log(r.stdout.trim());
}

async function main() {
  const ycBin = findYc();
  console.log(`[deploy] using ${ycBin}`);

  const versions = yc(ycBin, [
    "serverless",
    "function",
    "version",
    "list",
    "--function-name",
    LEAD_FUNCTION,
    "--limit",
    "1",
  ]);
  const leadVersion = versions[0];
  if (!leadVersion?.environment) {
    throw new Error("no bm-lead-receiver version with environment");
  }

  const opsToken = readOrCreateOpsToken();
  const opsEnv = buildOpsEnv(leadVersion.environment, opsToken);
  const zipPath = zipFunction();

  if (!functionExists(ycBin, OPS_FUNCTION)) {
    console.log(`[deploy] creating function ${OPS_FUNCTION}`);
    ycText(ycBin, ["serverless", "function", "create", "--name", OPS_FUNCTION]);
  }

  const created = yc(ycBin, [
    "serverless",
    "function",
    "version",
    "create",
    "--function-name",
    OPS_FUNCTION,
    "--runtime",
    RUNTIME,
    "--entrypoint",
    ENTRYPOINT,
    "--memory",
    "128m",
    "--execution-timeout",
    "10s",
    "--source-path",
    zipPath,
    ...envArgs(opsEnv),
  ]);
  console.log(`[deploy] ops version ${created.id}`);

  try {
    ycText(ycBin, ["serverless", "function", "allow-unauthenticated-invoke", OPS_FUNCTION]);
  } catch (e) {
    console.warn("[deploy] allow-unauthenticated-invoke:", e.message);
  }

  const fn = yc(ycBin, ["serverless", "function", "get", "--name", OPS_FUNCTION]);
  const opsUrl = fn.http_invoke_url;
  console.log(`[deploy] OPS_REPORT_URL=${opsUrl}`);

  patchLeadReceiver(ycBin, leadVersion.id, opsUrl, opsToken);
  writeDeployNotes(opsUrl, opsToken, leadVersion.id);

  console.log("[deploy] done — set NEXT_PUBLIC_OPS_REPORT_URL on Timeweb and redeploy static site");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
