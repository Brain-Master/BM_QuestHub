#!/usr/bin/env node
/**
 * Timeweb App Platform helpers (requires GitHub linked in panel first).
 *
 *   node scripts/timeweb-apps.mjs list
 *   node scripts/timeweb-apps.mjs repos
 *   node scripts/timeweb-apps.mjs create --name bm-questhub --branch main
 *
 * TIMEWEB_API_TOKEN in scripts/timeweb.env
 */
import fs from "node:fs";
import path from "node:path";
import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const API = "https://api.timeweb.cloud";

async function api(pathname, options = {}) {
  const token = process.env.TIMEWEB_API_TOKEN?.trim();
  if (!token) {
    console.error("[timeweb-apps] set TIMEWEB_API_TOKEN in scripts/timeweb.env");
    process.exit(1);
  }
  const res = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    console.error(`[timeweb-apps] ${res.status} ${pathname}`, body);
    process.exit(1);
  }
  return body;
}

function readAppEnvs() {
  const example = path.join(ROOT, "apps", "web", "timeweb.app.env.example");
  const envs = {};
  if (!fs.existsSync(example)) return envs;
  for (const line of fs.readFileSync(example, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (v) envs[k] = v;
  }
  return envs;
}

async function listProviders() {
  const body = await api("/api/v1/vcs-provider");
  return body?.providers ?? body?.vcs_providers ?? body ?? [];
}

function brainMasterProvider(providers) {
  return (
    providers.find((p) => p.login === "Brain-Master" || p.provider === "github") ??
    providers[0]
  );
}

async function fetchCommitSha(providerId, repositoryId, branch) {
  const body = await api(
    `/api/v1/vcs-provider/${providerId}/repository/${repositoryId}/branch?name=${encodeURIComponent(branch)}`,
  );
  const commits = body?.commits ?? [];
  const sha = commits[0]?.sha ?? commits[0]?.commit_sha;
  if (sha) return sha;
  throw new Error(`[timeweb-apps] no commit for branch ${branch}`);
}

async function findQuestHubRepo(providerId) {
  const body = await api(`/api/v1/vcs-provider/${providerId}`);
  const repos = body?.repositories ?? body ?? [];
  return repos.find(
    (r) =>
      r.full_name?.toLowerCase().includes("bm_questhub") ||
      r.name?.toLowerCase() === "bm_questhub" ||
      r.url?.includes("BM_QuestHub"),
  );
}

async function main() {
  const cmd = process.argv[2] || "list";

  if (cmd === "list") {
    console.log(JSON.stringify(await api("/api/v1/apps"), null, 2));
    return;
  }

  if (cmd === "repos") {
    const providers = await listProviders();
    console.log("[timeweb-apps] providers:", JSON.stringify(providers, null, 2));
    for (const p of providers) {
      const id = p.id ?? p.provider_id;
      console.log(`\n[timeweb-apps] repositories for provider ${id}:`);
      console.log(JSON.stringify(await api(`/api/v1/vcs-provider/${id}`), null, 2));
    }
    return;
  }

  if (cmd === "create") {
    const nameIdx = process.argv.indexOf("--name");
    const branchIdx = process.argv.indexOf("--branch");
    const appName = nameIdx >= 0 ? process.argv[nameIdx + 1] : "bm-questhub";
    const branch = branchIdx >= 0 ? process.argv[branchIdx + 1] : "main";

    const providers = await listProviders();
    if (!providers.length) {
      console.error(
        "[timeweb-apps] No VCS providers. Link GitHub in App Platform panel first.",
      );
      process.exit(1);
    }
    const provider = brainMasterProvider(providers);
    const providerId = provider.id ?? provider.provider_id;
    const repo = await findQuestHubRepo(providerId);
    if (!repo) {
      console.error("[timeweb-apps] BM_QuestHub repo not found. Run: node scripts/timeweb-apps.mjs repos");
      process.exit(1);
    }
    const repositoryId = repo.id ?? repo.repository_id;
    const presets = await api("/api/v1/presets/apps");
    const presetList =
      presets?.frontend_presets ??
      presets?.apps_presets ??
      presets?.presets ??
      [];
    const ruPreset =
      presetList.find((p) => p.location === "ru-1") ?? presetList[0];
    const presetId = ruPreset?.id;
    if (!presetId) {
      console.error("[timeweb-apps] no app preset id");
      process.exit(1);
    }

    loadRepoEnv();
    const envs = readAppEnvs();
    const s3Base = process.env.S3_BUCKET
      ? `https://${process.env.S3_BUCKET}.s3.twcstorage.ru`
      : envs.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    if (s3Base) envs.NEXT_PUBLIC_S3_PUBLIC_BASE_URL = s3Base;

    const commitSha = await fetchCommitSha(providerId, repositoryId, branch);
    console.log(`[timeweb-apps] deploy branch ${branch} @ ${commitSha.slice(0, 7)}`);

    const payload = {
      provider_id: String(providerId),
      type: "frontend",
      repository_id: String(repositoryId),
      build_cmd: "npm run build",
      branch_name: branch,
      is_auto_deploy: true,
      commit_sha: commitSha,
      name: appName,
      comment: "BrainMaster Quest Hub static export",
      preset_id: presetId,
      env_version: "22",
      framework: "next.js",
      index_dir: "/apps/web/out",
      envs,
    };

    console.log("[timeweb-apps] creating app (SSR must be off in framework settings — verify in panel)...");
    const created = await api("/api/v1/apps", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log(JSON.stringify(created, null, 2));
    return;
  }

  console.error("Usage: list | repos | create [--name bm-questhub] [--branch main]");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
