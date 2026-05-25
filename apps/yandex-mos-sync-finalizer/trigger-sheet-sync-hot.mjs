/**
 * Dispatch GitHub Actions sheet-sync.yml (tier=hot) — same contract as content-admin.
 * Used from YCF bm-mos-enrolled-sync when MOS_ENROLLED_AUTO_PUBLISH=1.
 *
 * @returns {Promise<{ ok: boolean, skipped?: boolean, reason?: string, workflow?: string }>}
 */
export async function triggerSheetSyncHot() {
  const token = process.env.CONTENT_REBUILD_GITHUB_TOKEN?.trim();
  const repository =
    process.env.CONTENT_REBUILD_REPOSITORY?.trim() || "Brain-Master/BM_QuestHub";
  const workflow = process.env.SHEET_SYNC_WORKFLOW?.trim() || "sheet-sync.yml";
  const ref = process.env.CONTENT_REBUILD_REF?.trim() || "main";

  if (!token) {
    return {
      ok: false,
      skipped: true,
      reason: "CONTENT_REBUILD_GITHUB_TOKEN not set on function",
    };
  }

  const url = `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref, inputs: { tier: "hot" } }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      skipped: false,
      reason: `GitHub ${res.status}: ${text.slice(0, 300)}`,
    };
  }

  return { ok: true, skipped: false, workflow, repository, ref };
}
