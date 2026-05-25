import crypto from "node:crypto";

import {
  readOpsJsonWithMeta,
  readOpsText,
  writeOpsJson,
  writeOpsRaw,
} from "./mos-ops-s3.mjs";
import { mosSyncDebug } from "./mos-sync-debug.mjs";
import { sendTelegramAlert } from "./telegram-alert.mjs";

export const MOS_ENROLLED_EVENTS_KEY =
  process.env.MOS_ENROLLED_EVENTS_S3_KEY?.trim() || "ops/mos-enrolled-events.jsonl";
export const MOS_ENROLLED_STATS_KEY =
  process.env.MOS_ENROLLED_STATS_S3_KEY?.trim() || "ops/mos-enrolled-stats.json";
export const MOS_ENROLLED_SNAPSHOT_KEY =
  process.env.MOS_ENROLLED_SNAPSHOT_S3_KEY?.trim() || "ops/mos-enrolled-snapshot.json";

const RETENTION_DAYS = Number(process.env.MOS_ENROLLED_EVENTS_RETENTION_DAYS || 90);

/**
 * @param {unknown} raw
 */
export function normalizeEnrolledSnapshot(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [url, value] of Object.entries(/** @type {Record<string, unknown>} */ (raw))) {
    if (!value || typeof value !== "object") continue;
    const row = /** @type {{ enrolled?: number, shiftGroupId?: string, formatType?: string }} */ (
      value
    );
    if (typeof row.enrolled !== "number" || !Number.isFinite(row.enrolled)) continue;
    out[url] = {
      enrolled: Math.round(row.enrolled),
      shiftGroupId: String(row.shiftGroupId ?? "").trim(),
      formatType: String(row.formatType ?? "").trim(),
    };
  }
  return out;
}

/** @returns {Promise<{ snapshot: Record<string, { enrolled: number, shiftGroupId: string, formatType: string }>, readOk: boolean }>} */
export async function loadEnrolledSnapshotWithMeta() {
  const stored = await readOpsJsonWithMeta(MOS_ENROLLED_SNAPSHOT_KEY);
  return {
    snapshot: normalizeEnrolledSnapshot(stored.data),
    readOk: stored.readOk,
  };
}

export async function loadEnrolledSnapshot() {
  const { snapshot } = await loadEnrolledSnapshotWithMeta();
  return snapshot;
}

/**
 * @param {Record<string, { enrolled: number, shiftGroupId: string, formatType: string }>} snapshot
 */
export async function saveEnrolledSnapshot(snapshot) {
  const maxAttempts = Number(process.env.MOS_ENROLLED_SNAPSHOT_S3_ATTEMPTS || 2);
  const ok = await writeOpsJson(
    MOS_ENROLLED_SNAPSHOT_KEY,
    {
      ...snapshot,
      _updatedAt: new Date().toISOString(),
    },
    { maxAttempts: Number.isFinite(maxAttempts) && maxAttempts > 0 ? maxAttempts : 2 },
  );
  if (!ok) {
    console.warn(`[mos-enrolled] saveEnrolledSnapshot failed: ${MOS_ENROLLED_SNAPSHOT_KEY}`);
  } else {
    mosSyncDebug(
      `saveEnrolledSnapshot ok (${Object.keys(snapshot).length} urls)`,
    );
  }
  return ok;
}

/**
 * @param {string} iso
 */
function hourBucket(iso) {
  const d = new Date(iso);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

/**
 * @param {unknown} raw
 */
function normalizeStats(raw) {
  if (!raw || typeof raw !== "object") {
    return { version: 1, hourly: [], daily: [] };
  }
  const doc = /** @type {{ hourly?: unknown[], daily?: unknown[] }} */ (raw);
  return {
    version: 1,
    hourly: Array.isArray(doc.hourly) ? doc.hourly : [],
    daily: Array.isArray(doc.daily) ? doc.daily : [],
  };
}

/**
 * @param {{
 *   at: string,
 *   type: string,
 *   shiftGroupId?: string,
 *   formatType?: string,
 *   mosUrl: string,
 *   before: number | null,
 *   after: number,
 *   delta: number,
 *   syncRunId?: string,
 *   visits1h?: number,
 *   intervalSec?: number,
 * }} event
 */
export async function appendEnrolledEvent(event) {
  await appendEnrolledEventsBatch([event]);
}

/**
 * @param {Array<Record<string, unknown>>} events
 */
export async function appendEnrolledEventsBatch(events) {
  if (events.length === 0) return true;

  const line = events.map((e) => JSON.stringify(e)).join("\n");
  const stored = await readOpsText(MOS_ENROLLED_EVENTS_KEY);
  const prev = stored?.text ?? "";
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const kept = prev
    .split("\n")
    .filter(Boolean)
    .filter((row) => {
      try {
        const obj = JSON.parse(row);
        return Date.parse(obj.at) >= cutoff;
      } catch {
        return false;
      }
    });
  kept.push(...line.split("\n").filter(Boolean));
  const body = `${kept.join("\n")}\n`;
  const ok = await writeOpsRaw(MOS_ENROLLED_EVENTS_KEY, body, { ifMatch: stored?.etag });
  if (!ok) {
    console.warn(`[mos-enrolled] appendEnrolledEventsBatch failed: ${MOS_ENROLLED_EVENTS_KEY}`);
  }
  return ok;
}

/**
 * @param {{
 *   periodStart: string | null,
 *   periodEnd: string,
 *   changes: Array<{
 *     url: string,
 *     before: number | null,
 *     after: number,
 *     delta: number,
 *     rows: Array<{ shiftGroupId: string, formatType: string }>,
 *   }>,
 *   syncRunId: string,
 *   visits1h: number,
 *   intervalSec: number,
 * }} ctx
 */
export async function recordEnrolledEvents(ctx) {
  const at = ctx.periodEnd;
  /** @type {Array<Record<string, unknown>>} */
  const batch = [];
  for (const change of ctx.changes) {
    if (change.delta <= 0) continue;
    for (const row of change.rows) {
      batch.push({
        at,
        type: "enrolled_increase",
        shiftGroupId: row.shiftGroupId,
        formatType: row.formatType,
        mosUrl: change.url,
        before: change.before,
        after: change.after,
        delta: change.delta,
        syncRunId: ctx.syncRunId,
        visits1h: ctx.visits1h,
        intervalSec: ctx.intervalSec,
      });
    }
  }
  if (batch.length > 0) {
    await appendEnrolledEventsBatch(batch);
  }

  const deltaSum = ctx.changes.reduce((s, c) => s + Math.max(0, c.delta), 0);
  const eventCount = ctx.changes.filter((c) => c.delta > 0).length;
  const bucket = hourBucket(at);

  const stored = await readOpsJsonWithMeta(MOS_ENROLLED_STATS_KEY);
  if (!stored.readOk) return null;
  const stats = normalizeStats(stored.data);
  const hourly = /** @type {Array<Record<string, unknown>>} */ (stats.hourly);
  const row =
    hourly.find((h) => h.bucket === bucket) ??
    {
      bucket,
      syncRuns: 0,
      urlsPolled: 0,
      enrolledDeltaSum: 0,
      enrolledIncreaseEvents: 0,
      visits1h: 0,
      avgIntervalSec: 0,
    };
  row.syncRuns = Number(row.syncRuns) + 1;
  row.urlsPolled = Number(row.urlsPolled) + ctx.changes.length;
  row.enrolledDeltaSum = Number(row.enrolledDeltaSum) + deltaSum;
  row.enrolledIncreaseEvents = Number(row.enrolledIncreaseEvents) + eventCount;
  row.visits1h = ctx.visits1h;
  row.avgIntervalSec = ctx.intervalSec;
  row.lastSyncAt = at;
  if (!hourly.includes(row)) hourly.push(row);
  hourly.sort((a, b) => String(a.bucket).localeCompare(String(b.bucket)));
  const maxHours = 24 * RETENTION_DAYS;
  stats.hourly = hourly.slice(-maxHours);
  await writeOpsJson(MOS_ENROLLED_STATS_KEY, stats);

  return { deltaSum, eventCount, changes: ctx.changes };
}

/**
 * @param {{ deltaSum: number, eventCount: number, changes: Parameters<typeof recordEnrolledEvents>[0]["changes"] }} summary
 * @param {{ periodStart: string | null, periodEnd: string, visits1h: number, intervalSec: number }} meta
 */
export async function maybeSendEnrolledDigest(summary, meta) {
  if (process.env.MOS_ENROLLED_TG_ENABLED?.trim() === "0") return;
  const minDelta = Number(process.env.MOS_ENROLLED_TG_MIN_DELTA || 1);
  if (summary.deltaSum < minDelta) return;

  const maxLines = Number(process.env.MOS_ENROLLED_TG_MAX_LINES || 15);
  const lines = [];
  let shown = 0;
  for (const change of summary.changes) {
    if (change.delta <= 0) continue;
    for (const row of change.rows) {
      if (shown >= maxLines) break;
      const label = [row.formatType, row.shiftGroupId].filter(Boolean).join(" · ") || change.url;
      lines.push(
        `• ${label}: +${change.delta} (${change.before ?? "—"}→${change.after})`,
      );
      shown++;
    }
  }
  const hidden =
    summary.changes.reduce((n, c) => n + (c.delta > 0 ? c.rows.length : 0), 0) - shown;
  const start = meta.periodStart
    ? new Date(meta.periodStart).toLocaleString("ru-RU", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit" })
    : "—";
  const end = new Date(meta.periodEnd).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  });

  let body = [
    "📋 Quest Hub · новые записи на mos.ru",
    `Период: ${start}–${end} (MSK)`,
    `Всего: +${summary.deltaSum} мест в ${summary.eventCount} сменах`,
    "",
    ...lines,
  ].join("\n");
  if (hidden > 0) body += `\n\n…и ещё ${hidden} смен`;
  body += `\n\nСайт: ${meta.visits1h} визита/ч, интервал sync ~${Math.round(meta.intervalSec / 60)} мин`;

  await sendTelegramAlert(body);
}

export function newSyncRunId() {
  return crypto.randomUUID();
}
