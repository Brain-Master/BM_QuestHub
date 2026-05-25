#!/usr/bin/env node
/**
 * Set GitHub secret MOS_ENROLLED_COOKIES_JSON + optional vars for mos-enrolled-sync.yml.
 *
 *   node scripts/setup-github-mos-enrolled-sync.mjs
 *   node scripts/setup-github-mos-enrolled-sync.mjs --dry-run-workflow
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
  throw new Error("gh CLI not found");
}

function readToken() {
  for (const key of ["GITHUB_TOKEN", "GH_TOKEN", "CONTENT_REBUILD_GITHUB_TOKEN"]) {
    if (process.env[key]?.trim()) return process.env[key].trim();
  }
  const file = path.join(ROOT, "secret", "github.token");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  throw new Error("GITHUB_TOKEN missing");
}

function gh(bin, args, token) {
  const r = spawnSync(bin, args, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
  });
  if (r.status !== 0) throw new Error(`gh ${args.join(" ")}\n${r.stderr || r.stdout}`);
  return (r.stdout || "").trim();
}

function ghSecretSet(bin, name, value, token) {
  const r = spawnSync(bin, ["secret", "set", name, "--repo", REPO], {
    input: value,
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
  });
  if (r.status !== 0) throw new Error(`gh secret set ${name}\n${r.stderr || r.stdout}`);
  console.log(`[github] secret ${name}`);
}

function readCookiesJson() {
  const p = path.join(ROOT, "secret", "mos-enrolled-sync.cookies.json");
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8").trim();
  return raw || null;
}

function main() {
  const token = readToken();
  const ghBin = findGh();

  gh(ghBin, ["repo", "view", REPO], token);

  const hotId =
    process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
    "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";
  gh(
    ghBin,
    ["variable", "set", "GOOGLE_SHEETS_HOT_SPREADSHEET_ID", "--repo", REPO, "--body", hotId],
    token,
  );
  console.log("[github] variable GOOGLE_SHEETS_HOT_SPREADSHEET_ID");

  const cookiesJson = readCookiesJson();
  if (cookiesJson) {
    ghSecretSet(ghBin, "MOS_ENROLLED_COOKIES_JSON", cookiesJson, token);
  } else {
    console.log(
      "[github] skip MOS_ENROLLED_COOKIES_JSON — public API; set later if needed",
    );
  }

  console.log(
    "[github] ensure GOOGLE_SERVICE_ACCOUNT_JSON secret exists (same as sheet-sync)",
  );

  if (process.argv.includes("--dry-run-workflow")) {
    gh(
      ghBin,
      [
        "workflow",
        "run",
        "mos-enrolled-sync.yml",
        "--repo",
        REPO,
        "--ref",
        "main",
        "-f",
        "dry_run=true",
      ],
      token,
    );
    console.log("[github] dispatched mos-enrolled-sync.yml (dry_run=true)");
  }

  console.log("[github] done");
}

main();
