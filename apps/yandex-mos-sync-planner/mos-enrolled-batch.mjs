import {
  initMosCookieSession,
  notifyMosCookiesExpired,
} from "./mos-enrolled-cookie-store.mjs";
import { notifyMosSyncFailure } from "./mos-sync-failure-alert.mjs";
import {
  appendEnrolledEvent,
  loadEnrolledSnapshotWithMeta,
} from "./mos-enrolled-events.mjs";
import { fetchMosEnrolledCount } from "./mos-enrolled-fetch.mjs";
import { groupLifecycle } from "./mos-group-lifecycle.mjs";
import {
  FORMATS_SHEET,
  columnLetter,
  hotEnrolledTotalForUrl,
} from "./mos-enrolled-sync.mjs";
import { mosSyncTrace } from "./mos-sync-trace.mjs";
import { recordBatchProgress } from "./mos-sync-state.mjs";
import {
  readBatchResult,
  readRunManifest,
  writeBatchResult,
} from "./mos-sync-run.mjs";

function urlDelayWithJitter(baseMs) {
  if (baseMs <= 0) return 0;
  const jitter = Math.floor(Math.random() * 201) - 50;
  return Math.max(0, baseMs + jitter);
}

function fetchConcurrency() {
  const n = Number(process.env.MOS_ENROLLED_FETCH_CONCURRENCY || 2);
  if (!Number.isFinite(n) || n < 1) return 2;
  return Math.min(Math.round(n), 8);
}

function fetchTimeoutMs() {
  const n = Number(process.env.MOS_ENROLLED_FETCH_TIMEOUT_MS || 25_000);
  return Number.isFinite(n) && n > 0 ? n : 25_000;
}

/** Remaining wall-clock budget before YCF kills the worker (default: worker timeout − 15s). */
function batchBudgetMs() {
  const explicit = Number(process.env.MOS_ENROLLED_BATCH_BUDGET_MS);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const workerMs = Number(process.env.MOS_ENROLLED_WORKER_TIMEOUT_MS || 120_000);
  const worker = Number.isFinite(workerMs) && workerMs > 0 ? workerMs : 120_000;
  return Math.max(30_000, worker - 15_000);
}

function minChunkMs(fetchMs, delayMs) {
  return fetchMs + delayMs + 3000;
}

/**
 * @param {{ runId: string, batchIndex: number, urls: string[], root: string, dryRun?: boolean, onProgress?: (msg: string) => void }} options
 */
export async function processUrlBatch(options) {
  const { runId, batchIndex, urls, root, dryRun = false, onProgress } = options;

  const existing = await readBatchResult(runId, batchIndex);
  if (existing?.status === "ok") {
    onProgress?.(`[mos-batch] ${runId} batch-${batchIndex} already ok — skip`);
    return { ok: true, skipped: true, idempotent: true, batchIndex, runId };
  }

  const manifest = await readRunManifest(runId);
  if (!manifest?.byUrl) {
    throw new Error(`manifest missing for run ${runId}`);
  }
  if (!Array.isArray(manifest.urlBatches?.[batchIndex]) || JSON.stringify(manifest.urlBatches[batchIndex]) !== JSON.stringify(urls)) throw Error("MOS_BATCH_MANIFEST_MISMATCH");

  const delayMs = Number(process.env.MOS_ENROLLED_URL_DELAY_MS || 500);
  const concurrency = fetchConcurrency();
  const fetchMs = fetchTimeoutMs();
  const budgetMs = batchBudgetMs();
  const startedAt = Date.now();
  const periodEnd = new Date().toISOString();

  await initMosCookieSession(root);
  const [loadedSnapshot] = await Promise.all([loadEnrolledSnapshotWithMeta()]);
  const prevSnapshot = loadedSnapshot.snapshot;
  if (!loadedSnapshot.readOk) throw Error("MOS_BASELINE_READ_FAILED");

  /** @type {{ range: string, value: string }[]} */
  const pendingWrites = [];
  /** @type {{ url: string, message: string }[]} */
  const errors = [];
  /** @type {Array<{ url: string, before: number | null, after: number, delta: number, rows: { shiftGroupId: string, formatType: string }[] }>} */
  const changes = [];
  const skippedArchivedGroupIds = new Set();
  /** @type {Record<string, { enrolled: number, shiftGroupId: string, formatType: string }>} */
  const nextSnapshotPartial = {};
  let updatedRows = 0;
  let unchanged = 0;
  let authAlertSent = false;

  /**
   * @param {string} url
   */
  async function processOneUrl(url) {
    const plannedRows = manifest.byUrl[url];
    if (!Array.isArray(plannedRows) || plannedRows.length === 0) { errors.push({url,message:"MOS_BATCH_ROWS_MISSING"}); return; }
    const rows = plannedRows.filter(row => {
      const result = groupLifecycle(row.lifecycle);
      if (result.state === "unknown") errors.push({url,message:result.reason});
      if (result.state === "archived") skippedArchivedGroupIds.add(row.shiftGroupId);
      return result.state === "current" || result.state === "future";
    });
    if (!rows.length) return;

    const hotTotal = hotEnrolledTotalForUrl(
      rows.map((/** @type {{ enrolled?: number }} */ row) => ({
        enrolled: row.enrolled,
      })),
    );

    try {
      const mos = await fetchMosEnrolledCount(url);
      const snapshotBefore = prevSnapshot[url]?.enrolled;
      const before =
        typeof snapshotBefore === "number" ? snapshotBefore : hotTotal ?? null;
      const delta =
        typeof before === "number" ? mos.count - before : mos.count > 0 ? mos.count : 0;

      if (delta > 0) {
        changes.push({
          url,
          before,
          after: mos.count,
          delta,
          rows: rows.map((/** @type {{ shiftGroupId?: string, formatType?: string }} */ row) => ({
            shiftGroupId: String(row.shiftGroupId ?? "").trim(),
            formatType: String(row.formatType ?? "").trim(),
          })),
        });
      } else if (delta < 0 && !dryRun) {
        for (const row of rows) {
          await appendEnrolledEvent({
            at: periodEnd,
            type: "enrolled_decrease",
            shiftGroupId: String(row.shiftGroupId ?? "").trim(),
            formatType: String(row.formatType ?? "").trim(),
            mosUrl: url,
            before,
            after: mos.count,
            delta,
            syncRunId: runId,
          });
        }
      }

      const first = rows[0];
      nextSnapshotPartial[url] = {
        enrolled: mos.count,
        shiftGroupId: String(first?.shiftGroupId ?? "").trim(),
        formatType: String(first?.formatType ?? "").trim(),
      };

      const same =
        typeof hotTotal === "number" &&
        hotTotal === mos.count &&
        rows.every(
          (/** @type {{ enrolled?: number }} */ row) => row.enrolled === mos.count,
        );

      if (same) {
        unchanged += rows.length;
        return;
      }

      for (const row of rows) {
        if (row.enrolled === mos.count) {
          unchanged++;
          continue;
        }
        const col = columnLetter(row.enrolledCol);
        pendingWrites.push({
          range: `'${FORMATS_SHEET}'!${col}${row.sheetRow}`,
          value: String(mos.count),
        });
        updatedRows++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ url, message: msg });
      onProgress?.(`[mos-batch] ERROR ${url}: ${msg}`);
      if (!authAlertSent && /blocked HTTP|401|403|mos\.ru/i.test(msg)) {
        authAlertSent = true;
        await notifyMosCookiesExpired(msg);
      }
    }
  }

  mosSyncTrace("H2", "mos-enrolled-batch.mjs", "batch start", {
    runId,
    batchIndex,
    urlCount: urls.length,
    concurrency,
    budgetMs,
  });

  let budgetExhausted = false;

  for (let i = 0; i < urls.length; i += concurrency) {
    const remaining = budgetMs - (Date.now() - startedAt);
    if (remaining < minChunkMs(fetchMs, delayMs)) {
      const pending = urls.slice(i);
      for (const url of pending) {
        const alreadyDone =
          url in nextSnapshotPartial ||
          errors.some((entry) => entry.url === url);
        if (!alreadyDone) {
          errors.push({ url, message: "skipped: worker time budget exhausted" });
        }
      }
      budgetExhausted = true;
      onProgress?.(
        `[mos-batch] time budget exhausted — flushing partial (${i}/${urls.length} URLs processed)`,
      );
      break;
    }

    if (i > 0 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, urlDelayWithJitter(delayMs)));
    }
    const chunk = urls.slice(i, i + concurrency);
    await Promise.all(chunk.map((url) => processOneUrl(url)));
  }

  const ok = errors.length === 0;
  const payload = {
    status: ok ? "ok" : "partial",
    runId,
    batchIndex,
    at: new Date().toISOString(),
    nextSnapshotPartial,
    pendingWrites,
    skippedArchivedGroupIds: [...skippedArchivedGroupIds],
    errors,
    changes,
    updatedRows,
    unchanged,
  };

  if (!dryRun) {
    const written = await writeBatchResult(runId, batchIndex, payload);
    if (!written) {
      throw new Error(`batch result write failed: ${runId} #${batchIndex}`);
    }
    await recordBatchProgress({ failed: !ok });
    if (budgetExhausted) {
      try {
        await notifyMosSyncFailure({
          kind: "worker_timeout",
          message: `batch #${batchIndex} partial flush (${errors.length} errors) — worker time budget exhausted`,
          dryRun: false,
        });
      } catch {
        /* optional */
      }
    }
  }

  return {
    ok,
    runId,
    batchIndex,
    errors,
    updatedRows,
    unchanged,
    pendingWrites: pendingWrites.length,
    skippedArchivedGroupIds: [...skippedArchivedGroupIds],
    dryRun,
    budgetExhausted,
  };
}
