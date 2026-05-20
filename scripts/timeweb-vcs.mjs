/**
 * Shared Timeweb Cloud API + VCS helpers for deploy and app scripts.
 */
export const TIMEWEB_API = "https://api.timeweb.cloud";

export async function timewebApi(token, pathname, options = {}) {
  const t = token?.trim();
  if (!t) throw new Error("TIMEWEB_API_TOKEN required");

  const res = await fetch(`${TIMEWEB_API}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${t}`,
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
    throw new Error(
      `Timeweb API ${res.status} ${pathname}: ${typeof body === "string" ? body : JSON.stringify(body)}`,
    );
  }
  return body;
}

export function unwrapApp(body) {
  return body?.app ?? body;
}

export function resolveAppVcs(app, branchOverride) {
  const branch =
    branchOverride?.trim() || app?.branch?.trim() || app?.branch_name?.trim() || "main";
  const providerId = app?.provider?.id ?? app?.provider_id;
  const repositoryId = app?.repository?.id ?? app?.repository_id;
  return { branch, providerId, repositoryId };
}

export async function listProviders(token) {
  const body = await timewebApi(token, "/api/v1/vcs-provider");
  return body?.providers ?? body?.vcs_providers ?? body ?? [];
}

export function brainMasterProvider(providers) {
  return (
    providers.find((p) => p.login === "Brain-Master" || p.provider === "github") ??
    providers[0]
  );
}

export async function fetchCommitSha(token, providerId, repositoryId, branch) {
  const body = await timewebApi(
    token,
    `/api/v1/vcs-provider/${providerId}/repository/${repositoryId}/branch?name=${encodeURIComponent(branch)}`,
  );
  const commits = body?.commits ?? [];
  const sha = commits[0]?.sha ?? commits[0]?.commit_sha;
  if (sha) return sha;
  throw new Error(`[timeweb-vcs] no commit for branch ${branch}`);
}

export async function findQuestHubRepo(token, providerId) {
  const body = await timewebApi(token, `/api/v1/vcs-provider/${providerId}`);
  const repos = body?.repositories ?? body ?? [];
  return repos.find(
    (r) =>
      r.full_name?.toLowerCase().includes("bm_questhub") ||
      r.name?.toLowerCase() === "bm_questhub" ||
      r.url?.includes("BM_QuestHub"),
  );
}

const COMMIT_SHA_RE = /^[0-9a-f]{40}$/i;

/** CI / local override — skip Timeweb VCS branch API when set. */
export function resolveCommitShaOverride() {
  const raw =
    process.env.TIMEWEB_COMMIT_SHA?.trim() || process.env.GITHUB_SHA?.trim() || "";
  if (!raw) return null;
  if (!COMMIT_SHA_RE.test(raw)) {
    throw new Error(
      `[timeweb-vcs] invalid commit SHA override "${raw}" (expected 40 hex chars)`,
    );
  }
  return raw.toLowerCase();
}

/**
 * Resolve commit SHA for redeploying an existing Timeweb app.
 */
export async function resolveDeployCommitSha(token, appId, branchOverride) {
  const override = resolveCommitShaOverride();
  if (override) {
    const branch =
      branchOverride?.trim() ||
      process.env.TIMEWEB_DEPLOY_BRANCH?.trim() ||
      "main";
    return { commitSha: override, branch, providerId: null, repositoryId: null };
  }

  const raw = await timewebApi(token, `/api/v1/apps/${appId}`);
  const app = unwrapApp(raw);
  const { branch, providerId, repositoryId } = resolveAppVcs(app, branchOverride);

  if (!providerId || !repositoryId) {
    throw new Error(
      "[timeweb-vcs] App is not linked to GitHub (missing provider/repository). Check Timeweb App Platform panel.",
    );
  }

  const commitSha = await fetchCommitSha(token, providerId, repositoryId, branch);
  return { commitSha, branch, providerId, repositoryId };
}
