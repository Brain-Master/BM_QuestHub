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

  const batchesTotal = manifest.batchesTotal;
  if (!Number.isInteger(batchesTotal) || batchesTotal < 0 || !manifest.byUrl) return {ok:false,reason:"manifest_invalid",runId};
  if (batchesTotal === 0) {
    if (manifest.urlCount !== 0 || Object.keys(manifest.byUrl).length || !Array.isArray(manifest.archivedGroupIds) || !Array.isArray(manifest.lifecycleErrors)) return {ok:false,reason:"empty_manifest_invalid",runId};
    onProgress?.("[mos-finalize] no batches — idle");
    const errors = manifest.lifecycleErrors;
    let stateOk = true, publish = null;
    if (!dryRun) {
      const loaded = await loadSyncStateWithMeta();
      if (!loaded.readOk) return {ok:false,reason:"baseline_read_failed",runId};
      if (loaded.state.activeRunId && loaded.state.activeRunId !== runId) return {ok:false,reason:"run_changed",runId};
      const reset = await resetPipelineRunToIdle();
      if (reset !== true) return {ok:false,reason:"state_reset_failed",runId};
      const idle = {...loaded.state,runPhase:"idle",activeRunId:null,batchesTotal:0,batchesDone:0,batchesFailed:0,plannerAt:null,lastBatchAt:null,lockUntil:null};
      const finish = await onSyncFinished({ ok: errors.length === 0, hadChanges: false, runId }, idle);
      stateOk = finish.stateOk === true;
      if (stateOk && autoPublishEnabled()) publish = await triggerSheetSyncHot();
    }
    return { ok: errors.length === 0 && stateOk, runId, batchesTotal: 0, updatedRows: 0, archivedGroupIds: manifest.archivedGroupIds, errors, stateOk, publish };
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
  if (!loadedSnapshot.readOk || !loadedSyncState.readOk) return {ok:false,reason:"baseline_read_failed",runId};
  /** @type {Record<string, { enrolled: number, shiftGroupId: string, formatType: string }>} */
  const nextSnapshot = { ...prevSnapshot };

  /** @type {{ range: string, value: string }[]} */
  const pendingWrites = [];
  /** @type {{ url: string, message: string }[]} */
  const errors = [...(manifest.lifecycleErrors ?? [])];
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

  const ok = errors.length === 0 && batchesFailed === 0;
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

    // Annual groups are independent of legacy Sheet rows. Their direct-card
    // refresh must run even when archived legacy cards fail or stay unchanged.
    // `ok` remains the truthful legacy result; the workflow reports annual coverage.
    if (autoPublishEnabled()) {
      publish = await triggerSheetSyncHot();
      onProgress?.(
        publish.ok
          ? "[mos-finalize] hot sheet-sync dispatched"
          : `[mos-finalize] publish: ${publish.reason ?? "failed"}`,
      );
    }
  }

  return {
    ok: ok && snapshotOk && stateOk,
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
