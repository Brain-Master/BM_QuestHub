#!/usr/bin/env node
/**
 * Trigger Timeweb App Platform redeploy (no git commit).
 *
 * POST /api/v1/apps/{app_id}/deploy with commit_sha from app's VCS branch.
 * Poll GET /api/v1/apps/{app_id}/deploys until success or failure.
 * On failure: GET /api/v1/apps/{app_id}/deploy/{deploy_id}/logs
 *
 * Env (scripts/timeweb.env):
 *   TIMEWEB_API_TOKEN
 *   TIMEWEB_APP_ID
 *   TIMEWEB_DEPLOY_BRANCH (optional override; default: branch configured on the app)
 *
 * CLI:
 *   node scripts/timeweb-deploy.mjs
 *   node scripts/timeweb-deploy.mjs --logs-only --deploy-id=<uuid>
 */
import fs from "node:fs";
import path from "node:path";

import { loadRepoEnv } from "./load-dotenv.mjs";
import { resolveDeployCommitSha, timewebApi } from "./timeweb-vcs.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function latestDeploy(deploysBody) {
  const list =
    deploysBody?.deploys ??
    deploysBody?.apps_deploys ??
    deploysBody?.data ??
    deploysBody;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[0];
}

function parseCliArgs(argv) {
  const out = { logsOnly: false, deployId: null, appId: null };
  for (const arg of argv) {
    if (arg === "--logs-only") out.logsOnly = true;
    else if (arg.startsWith("--deploy-id=")) out.deployId = arg.slice("--deploy-id=".length).trim();
    else if (arg.startsWith("--app-id=")) out.appId = arg.slice("--app-id=".length).trim();
  }
  return out;
}

/** Normalize Timeweb deploy_logs payload to plain text lines. */
export function formatDeployLogs(body) {
  const raw =
    body?.deploy_logs ??
    body?.logs ??
    body?.log ??
    body?.data ??
    body;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((line) => {
        if (typeof line === "string") return line;
        if (line && typeof line === "object") {
          return line.message ?? line.text ?? line.content ?? JSON.stringify(line);
        }
        return String(line);
      })
      .join("\n");
  }
  if (raw && typeof raw === "object") {
    return JSON.stringify(raw, null, 2);
  }
  return body ? JSON.stringify(body, null, 2) : "";
}

export async function fetchDeployLogs(token, appId, deployId, options = {}) {
  const debug = options.debug ? "?debug=true" : "";
  const body = await timewebApi(
    token,
    `/api/v1/apps/${appId}/deploy/${deployId}/logs${debug}`,
  );
  return formatDeployLogs(body);
}

export function deployLogOutPath(appId, deployId) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(
    loadRepoEnv(),
    `deploy-logs-${appId}-${deployId.slice(0, 8)}-${stamp}.txt`,
  );
}

export async function printAndSaveDeployLogs(token, appId, deployId, options = {}) {
  const text = await fetchDeployLogs(token, appId, deployId, options);
  const outPath = options.outPath ?? deployLogOutPath(appId, deployId);
  fs.writeFileSync(outPath, text || "(empty deploy log)\n", "utf8");
  console.error(`[timeweb-deploy] log saved: ${outPath}`);
  const lines = (text || "").split(/\r?\n/).filter(Boolean);
  const tail = lines.slice(-50);
  if (tail.length > 0) {
    console.error("[timeweb-deploy] last log lines:");
    for (const line of tail) console.error(line);
  } else {
    console.error("[timeweb-deploy] deploy log empty");
  }
  return { text, outPath };
}

async function failDeploy(token, appId, deployId, deploy) {
  const id = deployId ?? deploy?.id;
  if (token && appId && id) {
    try {
      await printAndSaveDeployLogs(token, appId, id);
    } catch (e) {
      console.error(
        `[timeweb-deploy] could not fetch logs: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
  throw new Error(`Timeweb deploy failed: ${JSON.stringify(deploy)}`);
}

export async function triggerTimewebDeploy(options = {}) {
  loadRepoEnv();
  const token = process.env.TIMEWEB_API_TOKEN?.trim();
  const appId = options.appId?.trim() || process.env.TIMEWEB_APP_ID?.trim();
  if (!token || !appId) {
    console.warn(
      "[timeweb-deploy] skip: set TIMEWEB_API_TOKEN and TIMEWEB_APP_ID in scripts/timeweb.env",
    );
    return { ok: false, skipped: true };
  }

  const branchOverride =
    options.branch?.trim() || process.env.TIMEWEB_DEPLOY_BRANCH?.trim() || "";
  const { commitSha, branch } = await resolveDeployCommitSha(
    token,
    appId,
    branchOverride,
  );
  console.log(
    `[timeweb-deploy] branch=${branch} commit_sha=${commitSha.slice(0, 7)}`,
  );

  const pollMs = options.pollMs ?? 15_000;
  const timeoutMs = options.timeoutMs ?? 25 * 60_000;

  const created = await timewebApi(token, `/api/v1/apps/${appId}/deploy`, {
    method: "POST",
    body: JSON.stringify({ commit_sha: commitSha }),
  });

  const deployId = created?.deploy?.id ?? created?.id ?? null;
  console.log(`[timeweb-deploy] started deploy app=${appId} id=${deployId ?? "?"}`);

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await sleep(pollMs);
    const list = await timewebApi(token, `/api/v1/apps/${appId}/deploys`);
    const deploy = latestDeploy(list);
    const status = String(deploy?.status ?? "").toLowerCase();
    console.log(`[timeweb-deploy] status=${status || "unknown"}`);
    if (["success", "active", "finished", "done"].includes(status)) {
      return { ok: true, skipped: false, deploy, commitSha, branch };
    }
    if (["failed", "error", "stopped", "cancelled"].includes(status)) {
      const failedId = deploy?.id ?? deployId;
      await failDeploy(token, appId, failedId, deploy);
    }
  }

  throw new Error("[timeweb-deploy] timeout waiting for deploy");
}

async function cliFetchLogsOnly() {
  loadRepoEnv();
  const cli = parseCliArgs(process.argv.slice(2));
  const token = process.env.TIMEWEB_API_TOKEN?.trim();
  const appId = cli.appId || process.env.TIMEWEB_APP_ID?.trim();
  const deployId = cli.deployId;
  if (!token || !appId || !deployId) {
    console.error(
      "Usage: node scripts/timeweb-deploy.mjs --logs-only --deploy-id=<uuid> [--app-id=195536]",
    );
    process.exit(1);
  }
  await printAndSaveDeployLogs(token, appId, deployId);
}

const isCli = process.argv[1]?.includes("timeweb-deploy.mjs");
if (isCli) {
  const cli = parseCliArgs(process.argv.slice(2));
  if (cli.logsOnly) {
    cliFetchLogsOnly().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  } else {
    triggerTimewebDeploy().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
}
