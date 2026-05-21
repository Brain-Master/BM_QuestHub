#!/usr/bin/env node
/**
 * Trigger Timeweb App Platform redeploy (no git commit).
 *
 * POST /api/v1/apps/{app_id}/deploy with commit_sha from app's VCS branch.
 * Poll GET /api/v1/apps/{app_id}/deploys until success or failure.
 *
 * Env (scripts/timeweb.env):
 *   TIMEWEB_API_TOKEN
 *   TIMEWEB_APP_ID
 *   TIMEWEB_DEPLOY_BRANCH (optional override; default: branch configured on the app)
 */
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
      throw new Error(`Timeweb deploy failed: ${JSON.stringify(deploy)}`);
    }
  }

  throw new Error("[timeweb-deploy] timeout waiting for deploy");
}

const isCli = process.argv[1]?.includes("timeweb-deploy.mjs");
if (isCli) {
  triggerTimewebDeploy().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
