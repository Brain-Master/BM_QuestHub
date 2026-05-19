#!/usr/bin/env node
/**
 * Trigger Timeweb App Platform redeploy (no git commit).
 *
 * POST /api/v1/apps/{app_id}/deploy
 * Poll GET /api/v1/apps/{app_id}/deploys until success or failure.
 *
 * Env (scripts/timeweb.env):
 *   TIMEWEB_API_TOKEN
 *   TIMEWEB_APP_ID
 */
import { loadRepoEnv } from "./load-dotenv.mjs";

const API = "https://api.timeweb.cloud";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(token, pathname, options = {}) {
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
    throw new Error(`Timeweb API ${res.status} ${pathname}: ${JSON.stringify(body)}`);
  }
  return body;
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

  const pollMs = options.pollMs ?? 15_000;
  const timeoutMs = options.timeoutMs ?? 15 * 60_000;

  const created = await api(token, `/api/v1/apps/${appId}/deploy`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  const deployId = created?.deploy?.id ?? created?.id ?? null;
  console.log(`[timeweb-deploy] started deploy app=${appId} id=${deployId ?? "?"}`);

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await sleep(pollMs);
    const list = await api(token, `/api/v1/apps/${appId}/deploys`);
    const deploy = latestDeploy(list);
    const status = String(deploy?.status ?? "").toLowerCase();
    console.log(`[timeweb-deploy] status=${status || "unknown"}`);
    if (["success", "active", "finished", "done"].includes(status)) {
      return { ok: true, skipped: false, deploy };
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
