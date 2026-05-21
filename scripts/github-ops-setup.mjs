#!/usr/bin/env node
/**
 * Configure GitHub vars/secrets for ops-reporter + site-health (uses gh + GH_TOKEN).
 *
 *   node scripts/github-ops-setup.mjs
 *   node scripts/github-ops-setup.mjs --trigger-health
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const REPO = process.env.GITHUB_REPO?.trim() || "Brain-Master/BM_QuestHub";

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

function readSecretLine(fileRel, keyPrefix) {
  const filePath = path.join(ROOT, fileRel);
  if (!fs.existsSync(filePath)) return "";
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (line.startsWith(`${keyPrefix}=`)) {
      return line.slice(keyPrefix.length + 1).trim();
    }
  }
  return "";
}

function readToken() {
  for (const key of ["GITHUB_TOKEN", "GH_TOKEN", "CONTENT_REBUILD_GITHUB_TOKEN"]) {
    if (process.env[key]?.trim()) return process.env[key].trim();
  }
  const file = path.join(ROOT, "secret", "github.token");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  throw new Error("GITHUB_TOKEN missing — set env or secret/github.token");
}

function gh(bin, args, token) {
  const r = spawnSync(bin, args, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
    shell: false,
  });
  if (r.status !== 0) {
    throw new Error(`gh ${args.join(" ")}\n${r.stderr || r.stdout}`);
  }
  return (r.stdout || "").trim();
}

function ghSecretSet(bin, name, value, token) {
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
  const opsUrl =
    process.env.OPS_REPORT_URL?.trim() ||
    readSecretLine("secret/ops-reporter.deploy.txt", "OPS_REPORT_URL");
  const opsToken =
    process.env.OPS_REPORT_TOKEN?.trim() || readSecretLine("secret/ops-reporter.token");

  if (!opsUrl || !opsToken) {
    throw new Error("OPS_REPORT_URL / OPS_REPORT_TOKEN missing in secret/");
  }

  gh(ghBin, ["repo", "view", REPO], token);
  console.log(`[github] repo ok: ${REPO}`);

  gh(ghBin, ["variable", "set", "OPS_REPORT_URL", "--repo", REPO, "--body", opsUrl], token);
  console.log("[github] variable OPS_REPORT_URL");

  const healthUrls =
    process.env.SITE_HEALTH_URLS?.trim() ||
    "https://quest.b-master.pro/,https://quest.b-master.pro/catalog";
  gh(ghBin, ["variable", "set", "SITE_HEALTH_URLS", "--repo", REPO, "--body", healthUrls], token);
  console.log("[github] variable SITE_HEALTH_URLS");

  ghSecretSet(ghBin, "OPS_REPORT_TOKEN", opsToken, token);

  if (process.argv.includes("--trigger-health")) {
    gh(
      ghBin,
      ["workflow", "run", "site-health.yml", "--repo", REPO, "--ref", "main"],
      token,
    );
    console.log("[github] dispatched site-health.yml");
  }

  console.log("[github] done");
}

main();
