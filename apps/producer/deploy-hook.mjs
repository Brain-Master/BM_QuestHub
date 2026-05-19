#!/usr/bin/env node
/**
 * Deploy hooks after S3 publish.
 * Production: Timeweb App Platform API (no git commits).
 * Optional CI smoke: GitHub workflow_dispatch.
 */
import { loadRepoEnv } from "../../scripts/load-dotenv.mjs";

const WORKFLOW = process.env.CONTENT_REBUILD_WORKFLOW?.trim() || "content-rebuild.yml";
const SHEET_SYNC_WORKFLOW =
  process.env.SHEET_SYNC_WORKFLOW?.trim() || "sheet-sync.yml";
const REF = process.env.CONTENT_REBUILD_REF?.trim() || "main";

export async function triggerTimewebContentDeploy() {
  const { triggerTimewebDeploy } = await import(
    "../../scripts/timeweb-deploy.mjs"
  );
  return triggerTimewebDeploy();
}

export async function triggerGithubContentRebuild(reason = "snapshot-publish") {
  loadRepoEnv();

  const token = process.env.CONTENT_REBUILD_GITHUB_TOKEN?.trim();
  const repository = process.env.CONTENT_REBUILD_REPOSITORY?.trim();

  if (!token || !repository) {
    return { ok: false, skipped: true, reason: "github env not configured" };
  }

  const url = `https://api.github.com/repos/${repository}/actions/workflows/${WORKFLOW}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: REF, inputs: { reason } }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub dispatch failed ${res.status}: ${body}`);
  }

  console.log(`[deploy-hook] GitHub workflow ${WORKFLOW} on ${repository}@${REF}`);
  return { ok: true, skipped: false };
}

/** Cold content: Timeweb rebuild. Hot schedule: no deploy. */
export async function triggerContentDeploy(tier = "cold") {
  if (tier === "hot") {
    console.log("[deploy-hook] hot tier — skip Timeweb deploy");
    return { ok: true, skipped: true, tier: "hot" };
  }
  return triggerTimewebContentDeploy();
}

export async function triggerContentRebuild(reason = "snapshot-publish") {
  return triggerContentDeploy("cold");
}

/** Dispatch sheet-sync.yml (hot or cold) — used by Apps Script publish button. */
export async function triggerGithubSheetSync(tier = "hot") {
  loadRepoEnv();

  const token = process.env.CONTENT_REBUILD_GITHUB_TOKEN?.trim();
  const repository = process.env.CONTENT_REBUILD_REPOSITORY?.trim();

  if (!token || !repository) {
    return { ok: false, skipped: true, reason: "github env not configured" };
  }

  const safeTier = tier === "cold" ? "cold" : "hot";
  const url = `https://api.github.com/repos/${repository}/actions/workflows/${SHEET_SYNC_WORKFLOW}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: REF, inputs: { tier: safeTier } }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub sheet-sync dispatch failed ${res.status}: ${body}`);
  }

  console.log(
    `[deploy-hook] GitHub ${SHEET_SYNC_WORKFLOW} tier=${safeTier} on ${repository}@${REF}`,
  );
  return { ok: true, skipped: false, tier: safeTier };
}
