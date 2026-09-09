import {
  collectFormatsByMosUrl,
  fetchFormatsGrid,
  getToken,
  hotConfig,
} from "./mos-enrolled-sync.mjs";
import {
  initMosCookieSession,
} from "./mos-enrolled-cookie-store.mjs";
import { newSyncRunId } from "./mos-enrolled-events.mjs";
import { mosEnrolledSyncEnabled } from "./mos-enrolled-enabled.mjs";
import { patchPlannerRunStarted } from "./mos-sync-state.mjs";
import { writeRunManifest } from "./mos-sync-run.mjs";
import { sendYmqMessages } from "./mos-ymq.mjs";
import { currentMosRows, sheetGroupLifecycles } from "./mos-group-lifecycle.mjs";

function enrolledBatchSize() {
  const n = Number(process.env.MOS_ENROLLED_BATCH_SIZE || 8);
  if (!Number.isFinite(n) || n < 1) return 8;
  return Math.min(Math.round(n), 32);
}

/**
 * @param {Map<string, { url: string, rows: unknown[] }>} byUrl
 */
function serializeByUrl(byUrl) {
  /** @type {Record<string, unknown[]>} */
  const out = {};
  for (const [url, bucket] of byUrl) {
    out[url] = bucket.rows;
  }
  return out;
}

/**
 * @param {string[]} urls
 * @param {number} size
 */
function chunkUrls(urls, size) {
  /** @type {string[][]} */
  const batches = [];
  for (let i = 0; i < urls.length; i += size) {
    batches.push(urls.slice(i, i + size));
  }
  return batches;
}

/**
 * @param {{ root: string, dryRun?: boolean, force?: boolean, onProgress?: (msg: string) => void }} options
 */
export async function runMosEnrolledPlan(options) {
  const { root, dryRun = false, force = false, onProgress } = options;
  const gate = mosEnrolledSyncEnabled(root);
  if (!gate.enabled && !force) {
    return {
      ok: true,
      skipped: true,
      reason: gate.reason,
      runId: null,
      batchesTotal: 0,
      urlCount: 0,
    };
  }

  await initMosCookieSession(root);
  const runId = newSyncRunId();
  const token = await getToken();
  const { spreadsheetId, range } = hotConfig();
  const grid = await fetchFormatsGrid(token, spreadsheetId, range);
  const collected = collectFormatsByMosUrl(grid);
  const groupGrid = await fetchFormatsGrid(token, spreadsheetId, process.env.GOOGLE_SHEETS_HOT_RANGE_GROUPS?.trim() || "'Группы'!A:AZ");
  const selection = currentMosRows(collected.byUrl, sheetGroupLifecycles(groupGrid));
  const { byUrl } = selection, { skippedRows } = collected;
  const urls = [...byUrl.keys()].sort();
  const batchSize = enrolledBatchSize();
  const urlBatches = chunkUrls(urls, batchSize);
  const batchesTotal = urlBatches.length;

  onProgress?.(
    `[mos-plan] ${urls.length} URL(s), ${batchesTotal} batch(es) size=${batchSize}, ${skippedRows} skipped row(s)`,
  );

  const manifest = {
    runId,
    createdAt: new Date().toISOString(),
    spreadsheetId,
    range,
    batchSize,
    batchesTotal,
    urlCount: urls.length,
    skippedRows,
    byUrl: serializeByUrl(byUrl),
    urlBatches,
    lifecycleDate: selection.lifecycleDate,
    archivedGroupIds: selection.archivedGroupIds,
    lifecycleErrors: selection.errors,
  };

  if (!dryRun) {
    const manifestOk = await writeRunManifest(runId, manifest);
    if (!manifestOk) {
      return {
        ok: false,
        skipped: false,
        reason: "manifest_write_failed",
        runId,
        batchesTotal,
        urlCount: urls.length,
      };
    }

    // Workers must never race a later counter reset from the planner.
    const stateOk = await patchPlannerRunStarted({ runId, batchesTotal });
    if (!stateOk) return {ok:false,reason:"planner_state_write_failed",runId,batchesTotal,urlCount:urls.length};

    const messages = urlBatches.map((batchUrls, batchIndex) => ({
      runId,
      batchIndex,
      urls: batchUrls,
    }));

    if (messages.length > 0) {
      await sendYmqMessages(messages);
      onProgress?.(`[mos-plan] enqueued ${messages.length} YMQ message(s)`);
    }

  }

  return {
    ok: true,
    skipped: false,
    reason: gate.reason,
    runId,
    batchesTotal,
    urlCount: urls.length,
    dryRun,
    wouldEnqueue: dryRun ? batchesTotal : undefined,
  };
}
