import { createOpsS3, mergeOpsJson } from "./mos-ops-s3.mjs";

export const SCHEDULE_TRAFFIC_S3_KEY =
  process.env.SCHEDULE_TRAFFIC_S3_KEY?.trim() || "ops/schedule-traffic.json";

const BUCKET_MS = 5 * 60 * 1000;
const RETENTION_MS = 48 * 60 * 60 * 1000;

/**
 * @param {number} ts
 */
export function bucketStartIso(ts = Date.now()) {
  const start = Math.floor(ts / BUCKET_MS) * BUCKET_MS;
  return new Date(start).toISOString();
}

/**
 * @param {unknown} raw
 */
function normalizeTrafficDoc(raw) {
  if (!raw || typeof raw !== "object") {
    return { version: 1, buckets: [], updatedAt: null };
  }
  const doc = /** @type {{ buckets?: unknown[] }} */ (raw);
  const buckets = Array.isArray(doc.buckets)
    ? doc.buckets
        .map((b) => {
          const row = /** @type {{ at?: string, visits?: number }} */ (b);
          const visits = Number(row.visits);
          if (!row.at || !Number.isFinite(visits) || visits < 0) return null;
          return { at: row.at, visits: Math.round(visits) };
        })
        .filter(Boolean)
    : [];
  return { version: 1, buckets, updatedAt: /** @type {{ updatedAt?: string }} */ (raw).updatedAt ?? null };
}

/**
 * @param {{ at: string, visits: number }[]} buckets
 * @param {number} nowMs
 */
function pruneBuckets(buckets, nowMs) {
  const minAt = nowMs - RETENTION_MS;
  return buckets.filter((b) => Date.parse(b.at) >= minAt);
}

/**
 * @param {{ at: string, visits: number }[]} buckets
 * @param {number} windowMs
 * @param {number} [nowMs]
 */
export function sumVisitsInWindow(buckets, windowMs, nowMs = Date.now()) {
  const minAt = nowMs - windowMs;
  return buckets.reduce((sum, b) => {
    if (Date.parse(b.at) < minAt) return sum;
    return sum + b.visits;
  }, 0);
}

/**
 * @param {{ at: string, visits: number }[]} buckets
 * @param {number} [nowMs]
 */
export function trafficRollup(buckets, nowMs = Date.now()) {
  const visits5m = sumVisitsInWindow(buckets, 5 * 60 * 1000, nowMs);
  const visits15m = sumVisitsInWindow(buckets, 15 * 60 * 1000, nowMs);
  const visits1h = sumVisitsInWindow(buckets, 60 * 60 * 1000, nowMs);
  const visits6h = sumVisitsInWindow(buckets, 6 * 60 * 60 * 1000, nowMs);

  const prev15mStart = nowMs - 30 * 60 * 1000;
  const prev15mEnd = nowMs - 15 * 60 * 1000;
  const visits15mPrev = buckets.reduce((sum, b) => {
    const t = Date.parse(b.at);
    if (t >= prev15mStart && t < prev15mEnd) return sum + b.visits;
    return sum;
  }, 0);
  const dv = visits15m - visits15mPrev;

  return { visits5m, visits15m, visits1h, visits6h, dv };
}

/**
 * @param {{ page?: string, ts?: number }} input
 */
export async function recordScheduleVisit(input = {}) {
  const cfg = createOpsS3();
  if (!cfg) throw new Error("S3_BUCKET not configured");

  const at = bucketStartIso(input.ts ?? Date.now());
  const page = String(input.page ?? "schedule").trim() || "schedule";
  const nowMs = input.ts ?? Date.now();

  const merged = await mergeOpsJson(SCHEDULE_TRAFFIC_S3_KEY, (raw) => {
    const doc = normalizeTrafficDoc(raw);
    doc.buckets = pruneBuckets(doc.buckets, nowMs);
    const bucket = doc.buckets.find((b) => b.at === at);
    if (bucket) {
      bucket.visits += 1;
    } else {
      doc.buckets.push({ at, visits: 1 });
    }
    doc.buckets.sort((a, b) => a.at.localeCompare(b.at));
    doc.updatedAt = new Date(nowMs).toISOString();
    doc.lastPage = page;
    return doc;
  });
  if (!merged) throw new Error("schedule_traffic_s3_write_failed");
  return merged;
}

/**
 * @param {number} [nowMs]
 */
export async function loadTrafficRollup(nowMs = Date.now()) {
  try {
    const { readOpsJson } = await import("./mos-ops-s3.mjs");
    const stored = await readOpsJson(SCHEDULE_TRAFFIC_S3_KEY);
    const doc = normalizeTrafficDoc(stored?.data);
    const buckets = pruneBuckets(doc.buckets, nowMs);
    return trafficRollup(buckets, nowMs);
  } catch (err) {
    console.warn("[traffic] rollup fallback:", err instanceof Error ? err.message : err);
    return { visits5m: 0, visits15m: 0, visits1h: 0, visits6h: 0, dv: 0 };
  }
}
