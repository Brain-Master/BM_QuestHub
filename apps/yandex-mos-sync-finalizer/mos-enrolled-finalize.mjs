import {
  initMosCookieSession,
  persistMosCookieSession,
} from "./mos-enrolled-cookie-store.mjs";
import {
  loadEnrolledSnapshotWithMeta,
  maybeSendEnrolledDigest,
  recordEnrolledEvents,
  saveEnrolledSnapshot,
} from "./mos-enrolled-events.mjs";
import { mosEnrolledSyncEnabled } from "./mos-enrolled-enabled.mjs";
import {
  batchWriteCells,
  getToken,
} from "./mos-enrolled-sync.mjs";
import { notifyMosSyncFailure } from "./mos-sync-failure-alert.mjs";
import {
  loadSyncStateWithMeta,
  onSyncFinished,
  patchFinalizeRunStarted,
  resetPipelineRunToIdle,
} from "./mos-sync-state.mjs";
import { mosSyncTrace } from "./mos-sync-trace.mjs";
import { loadTrafficRollup } from "./schedule-traffic.mjs";
import { triggerSheetSyncHot } from "./trigger-sheet-sync-hot.mjs";
import {
  readBatchResult,
  readRunManifest,
} from "./mos-sync-run.mjs";

function autoPublishEnabled() {
  return process.env.MOS_ENROLLED_AUTO_PUBLISH === "1";
}

/**
 * @param {string} runId
 * @param {number} batchesTotal
 */
async function loadAllBatchResults(runId, batchesTotal) {
  /** @type {Awaited<ReturnType<typeof readBatchResult>>[]} */
  const batches = [];
  for (let i = 0; i < batchesTotal; i++) {
    const b = await readBatchResult(runId, i);
    if (!b) {
      throw new Error(`missing batch-${String(i).padStart(3, "0")}.json for ${runId}`);
    }
    batches.push(b);
  }
  return batches;
}

/**
 * @param {{ root: string, runId: string, dryRun?: boolean, onProgress?: (msg: string) => void }} options
 */
export async function runMosEnrolledFinalize(options) {
  const { root, runId, dryRun = false, onProgress } = options;
  const gate = mosEnrolledSyncEnabled(root);

  const manifest = await readRunManifest(runId);
  if (!manifest) {
    return { ok: false, reason: "manifest_missing", runId };
  }

  const batchesTotal = manifest.batchesTotal ?? 0;
  if (batchesTotal === 0) {
    onProgress?.("[mos-finalize] no batches — idle");
    if (!dryRun) {
      await resetPipelineRunToIdle();
      await onSyncFinished({ ok: true, hadChanges: false, runId }, null);
    }
    return { ok: true, runId, batchesTotal: 0, updatedRows: 0, errors: [] };
  }

  if (!dryRun) {
    await patchFinalizeRunStarted(runId);
  }

  await initMosCookieSession(root);
  const batches = await loadAllBatchResults(runId, batchesTotal);

  const [loadedSnapshot, loadedSyncState] = await Promise.all([
    loadEnrolledSnapshotWithMeta(),
    loadSyncStateWithMeta(),
  ]);
  const prevSnapshot = loadedSnapshot.snapshot;
  /** @type {Record<string, { enrolled: number, shiftGroupId: string, formatType: string }>} */
  const nextSnapshot = { ...prevSnapshot };

  /** @type {{ range: string, value: string }[]} */
  const pendingWrites = [];
  /** @type {{ url: string, message: string }[]} */
  const errors = [];
  /** @type {Array<{ url: string, before: number | null, after: number, delta: number, rows: { shiftGroupId: string, formatType: string }[] }>} */
  const changes = [];
  let updatedRows = 0;
  let unchanged = 0;
  let batchesFailed = 0;

  for (const batch of batches) {
    if (batch.status !== "ok") batchesFailed++;
    if (batch.errors?.length) {
      errors.push(...batch.errors);
    }
    if (batch.pendingWrites?.length) {
      pendingWrites.push(...batch.pendingWrites);
    }
    if (batch.changes?.length) {
      changes.push(...batch.changes);
    }
    updatedRows += batch.updatedRows ?? 0;
    unchanged += batch.unchanged ?? 0;
    const partial = batch.nextSnapshotPartial ?? {};
    for (const [url, entry] of Object.entries(partial)) {
      nextSnapshot[url] = entry;
    }
  }

  const syncState = loadedSyncState.state;
  const periodStart = syncState.lastSyncAt;
  const periodEnd = new Date().toISOString();
  const spreadsheetId = manifest.spreadsheetId;

  onProgress?.(
    `[mos-finalize] merge ${batchesTotal} batch(es): writes=${pendingWrites.length} errors=${errors.length}`,
  );

  if (!dryRun && pendingWrites.length > 0) {
    const token = await getToken();
    mosSyncTrace("H2", "mos-enrolled-finalize.mjs", "batchWriteCells", {
      cells: pendingWrites.length,
    });
    await batchWriteCells(token, spreadsheetId, pendingWrites);
  }

  const cookieSave = await persistMosCookieSession(root);
  if (cookieSave.saved) {
    onProgress?.(`[mos-finalize] cookies saved → ${cookieSave.target}`);
  }

  const ok = errors.length === 0;
  let eventSummary = null;
  if (!dryRun && ok && changes.length > 0) {
    try {
      const traffic = await loadTrafficRollup();
      eventSummary = await recordEnrolledEvents({
        periodStart,
        periodEnd,
        changes,
        syncRunId: runId,
        visits1h: traffic.visits1h,
        intervalSec: syncState.lastIntervalSec,
      });
      await maybeSendEnrolledDigest(eventSummary, {
        periodStart,
        periodEnd,
        visits1h: traffic.visits1h,
        intervalSec: syncState.lastIntervalSec,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onProgress?.(`[mos-finalize] events/TG skipped: ${msg}`);
    }
  }

  if (!dryRun && batchesFailed > 0) {
    try {
      await notifyMosSyncFailure({
        kind: "batch_failures",
        message: `${batchesFailed} batch(es) not ok for run ${runId}`,
        dryRun: false,
      });
    } catch {
      /* alert optional */
    }
  }

  let snapshotOk = true;
  let stateOk = true;
  let publish = null;

  if (!dryRun) {
    snapshotOk = await saveEnrolledSnapshot(nextSnapshot);
    if (!snapshotOk) {
      onProgress?.("[mos-finalize] WARN snapshot not saved");
    }

    await resetPipelineRunToIdle();
    const finish = await onSyncFinished(
      {
        ok,
        hadChanges: updatedRows > 0,
        runId,
      },
      syncState,
    );
    stateOk = finish.stateOk === true;
    onProgress?.(
      `[mos-finalize] state ok=${stateOk} nextDueAt=${finish.nextDueAt ?? "?"}`,
    );

    if (ok && updatedRows > 0 && autoPublishEnabled()) {
      publish = await triggerSheetSyncHot();
      onProgress?.(
        publish.ok
          ? "[mos-finalize] hot sheet-sync dispatched"
          : `[mos-finalize] publish: ${publish.reason ?? "failed"}`,
      );
    }
  }

  return {
    ok,
    skipped: false,
    reason: gate.reason,
    runId,
    batchesTotal,
    batchesFailed,
    updatedRows: dryRun ? 0 : updatedRows,
    unchanged,
    errors,
    snapshotOk,
    stateOk,
    publish,
    enrolledDeltaSum: eventSummary?.deltaSum ?? 0,
  };
}
