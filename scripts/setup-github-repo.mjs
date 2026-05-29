#!/usr/bin/env node
/**
 * Configure GitHub repo secrets/vars for sheet-sync.yml (uses gh CLI).
 *
 *   node scripts/setup-github-repo.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const REPO = process.env.CONTENT_REBUILD_REPOSITORY?.trim() || "Brain-Master/BM_QuestHub";

function findGh() {
  const candidates = [
    process.env.GH_BIN?.trim(),
    path.join(process.env.ProgramFiles || "", "GitHub CLI", "gh.exe"),
    "gh",
  ].filter(Boolean);
  for (const bin of candidates) {
    if (bin === "gh") {
      const w = spawnSync("where.exe", ["gh"], { encoding: "utf8", shell: true });
      if (w.status === 0 && w.stdout?.trim()) {
        return w.stdout.trim().split(/\r?\n/)[0].trim();
      }
      continue;
    }
    if (fs.existsSync(bin)) return bin;
  }
  throw new Error("gh CLI not found — install GitHub CLI or set GH_BIN");
}

function readToken() {
  for (const key of [
    "CONTENT_REBUILD_GITHUB_TOKEN",
    "GITHUB_TOKEN",
    "GH_TOKEN",
  ]) {
    if (process.env[key]?.trim()) return process.env[key].trim();
  }
  const secretFile = path.join(ROOT, "secret", "github.token");
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, "utf8").trim();
  }
  throw new Error(
    "Set GITHUB_TOKEN / CONTENT_REBUILD_GITHUB_TOKEN or secret/github.token",
  );
}

function gh(bin, args, env) {
  const r = spawnSync(bin, args, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: env.GH_TOKEN, GITHUB_TOKEN: env.GH_TOKEN },
    shell: false,
  });
  if (r.status !== 0) {
    throw new Error(`gh ${args.join(" ")}\n${r.stderr || r.stdout}`);
  }
  return (r.stdout || "").trim();
}

function readSaJson() {
  loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) return inline;
  const dir = path.join(ROOT, "secret");
  const json = fs
    .readdirSync(dir)
    .find((f) => f.endsWith(".json") && f.includes("questhub"));
  if (json) return fs.readFileSync(path.join(dir, json), "utf8");
  throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing — run make setup-sheets-env");
}

function readSecretLine(fileRel, keyPrefix) {
  const filePath = path.join(ROOT, fileRel);
  if (!fs.existsSync(filePath)) return "";
  const text = fs.readFileSync(filePath, "utf8");
  if (!keyPrefix) return text.trim();
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith(`${keyPrefix}=`)) {
      return line.slice(keyPrefix.length + 1).trim();
    }
  }
  return "";
}

function setSecretFromStdin(bin, name, value, token) {
  const r = spawnSync(bin, ["secret", "set", name, "--repo", REPO], {
    input: value,
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
  });
  if (r.status !== 0) {
    throw new Error(`gh secret set ${name}\n${r.stderr || r.stdout}`);
  }
  console.log(`[github] secret ${name}`);
}

function main() {
  const token = readToken();
  const ghBin = findGh();
  loadDotEnv(path.join(ROOT, "scripts", "s3.env"));
  loadDotEnv(path.join(ROOT, "scripts", "timeweb.env"));
  loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));

  const env = { GH_TOKEN: token };
  gh(ghBin, ["repo", "view", REPO], env);
  console.log(`[github] repo ok: ${REPO}`);

  setSecretFromStdin(ghBin, "GOOGLE_SERVICE_ACCOUNT_JSON", readSaJson(), token);
  setSecretFromStdin(
    ghBin,
    "AWS_ACCESS_KEY_ID",
    process.env.AWS_ACCESS_KEY_ID?.trim() || "",
    token,
  );
  setSecretFromStdin(
    ghBin,
    "AWS_SECRET_ACCESS_KEY",
    process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    token,
  );
  setSecretFromStdin(ghBin, "S3_BUCKET", process.env.S3_BUCKET?.trim() || "", token);
  setSecretFromStdin(
    ghBin,
    "TIMEWEB_API_TOKEN",
    process.env.TIMEWEB_API_TOKEN?.trim() || "",
    token,
  );
  setSecretFromStdin(ghBin, "CONTENT_REBUILD_GITHUB_TOKEN", token, token);

  const telegramToken =
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    readSecretLine("secret/lead-receiver.deploy.txt", "TELEGRAM_BOT_TOKEN");
  const telegramChat =
    process.env.TELEGRAM_CHAT_ID?.trim() ||
    readSecretLine("secret/lead-receiver.deploy.txt", "TELEGRAM_CHAT_ID");
  if (telegramToken) {
    setSecretFromStdin(ghBin, "TELEGRAM_BOT_TOKEN", telegramToken, token);
  }
  if (telegramChat) {
    setSecretFromStdin(ghBin, "TELEGRAM_CHAT_ID", telegramChat, token);
  }

  const opsUrl =
    process.env.OPS_REPORT_URL?.trim() ||
    readSecretLine("secret/ops-reporter.deploy.txt", "OPS_REPORT_URL");
  const opsToken =
    process.env.OPS_REPORT_TOKEN?.trim() ||
    readSecretLine("secret/ops-reporter.token");

  if (opsToken) {
    setSecretFromStdin(ghBin, "OPS_REPORT_TOKEN", opsToken, token);
  }

  const vars = {
    GOOGLE_SHEETS_HOT_SPREADSHEET_ID:
      process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
      "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8",
    GOOGLE_SHEETS_COLD_SPREADSHEET_ID:
      process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() ||
      "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc",
    S3_ENDPOINT:
      process.env.S3_ENDPOINT?.trim() || "https://storage.yandexcloud.net",
    AWS_DEFAULT_REGION:
      process.env.AWS_DEFAULT_REGION?.trim() || "ru-central1",
    S3_PUBLIC_BASE_URL:
      process.env.S3_PUBLIC_BASE_URL?.trim() ||
      "https://storage.yandexcloud.net/bm-questhub",
    TIMEWEB_APP_ID: process.env.TIMEWEB_APP_ID?.trim() || "195536",
    ...(opsUrl ? { OPS_REPORT_URL: opsUrl } : {}),
    SITE_HEALTH_URLS:
      process.env.SITE_HEALTH_URLS?.trim() ||
      "https://quest.b-master.pro/,https://quest.b-master.pro/catalog",
  };

  for (const [name, value] of Object.entries(vars)) {
    if (!value) continue;
    gh(ghBin, ["variable", "set", name, "--repo", REPO, "--body", value], env);
    console.log(`[github] variable ${name}`);
  }

  console.log("[github] done");
}

main();
