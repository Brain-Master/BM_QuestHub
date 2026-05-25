import { GoogleAuth } from "google-auth-library";

import {
  initMosCookieSession,
  notifyMosCookiesExpired,
  persistMosCookieSession,
} from "./mos-enrolled-cookie-store.mjs";
import {
  appendEnrolledEvent,
  loadEnrolledSnapshotWithMeta,
  maybeSendEnrolledDigest,
  newSyncRunId,
  recordEnrolledEvents,
  saveEnrolledSnapshot,
} from "./mos-enrolled-events.mjs";
import { fetchMosEnrolledCount, normalizeMosActivityUrl } from "./mos-enrolled-fetch.mjs";
import { mosEnrolledSyncEnabled } from "./mos-enrolled-enabled.mjs";
import { mosSyncDebug } from "./mos-sync-debug.mjs";
import { loadSyncStateWithMeta, onSyncFinished } from "./mos-sync-state.mjs";
import { mosSyncTrace } from "./mos-sync-trace.mjs";
import { loadTrafficRollup } from "./schedule-traffic.mjs";

const DEFAULT_HOT_ID = "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";
export const FORMATS_SHEET = "Форматы";

function normalizeHeader(raw) {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function loadCredentials() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (b64) {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  }
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 required",
    );
  }
  return JSON.parse(inline);
}

export async function getToken() {
  const auth = new GoogleAuth({
    credentials: loadCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("no access token");
  return token.token;
}

export function hotConfig() {
  const spreadsheetId =
    process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ||
    DEFAULT_HOT_ID;
  const range =
    process.env.GOOGLE_SHEETS_HOT_RANGE_FORMATS?.trim() || `'${FORMATS_SHEET}'!A:AZ`;
  return { spreadsheetId, range };
}

/**
 * @param {string} token
 * @param {string} spreadsheetId
 * @param {string} range
 */
export async function fetchFormatsGrid(token, spreadsheetId, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.values ?? [];
}

/**
 * @param {string} token
 * @param {string} spreadsheetId
 * @param {{ range: string, value: string }[]} updates
 */
export async function batchWriteCells(token, spreadsheetId, updates) {
  if (updates.length === 0) return;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: updates.map((u) => ({
        range: u.range,
        values: [[u.value]],
      })),
    }),
  });
  if (!res.ok) throw new Error(`batchUpdate ${res.status}: ${await res.text()}`);
}

/** @param {unknown} raw */
export function parseEnrolledCell(raw) {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(raw);
    return n >= 0 ? n : undefined;
  }
  const s = String(raw).trim();
  if (!s) return undefined;
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 0 || n > 5_000_000) return undefined;
  return Math.round(n);
}

/**
 * Same dedupe rule as aggregateVariantEnrolled on the site.
 * @param {readonly { enrolled?: number }[]} rows
 */
export function hotEnrolledTotalForUrl(rows) {
  const values = rows
    .map((r) => r.enrolled)
    .filter((n) => typeof n === "number");
  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0];
  const first = values[0];
  if (values.every((n) => n === first)) return first;
  return values.reduce((a, b) => a + b, 0);
}

/**
 * @param {string[][]} grid
 */
export function collectFormatsByMosUrl(grid) {
  if (grid.length < 2) {
    return { headers: [], byUrl: new Map(), skippedRows: 0 };
  }

  const headers = grid[0].map(normalizeHeader);
  const idx = (name) => headers.indexOf(name);
  const colLink = idx("mos_ru_link");
  const colEnrolled = idx("enrolled");
  const colPrice = idx("price");
  const colShift = idx("shift_group_id");
  const colFormat = idx("format_type");

  if (colLink < 0) throw new Error('Missing column "mos_ru_link" on «Форматы»');
  if (colEnrolled < 0) throw new Error('Missing column "enrolled" on «Форматы»');

  /** @type {Map<string, { url: string, rows: { sheetRow: number, shiftGroupId: string, formatType: string, enrolled?: number, enrolledCol: number }[] }>} */
  const byUrl = new Map();
  let skippedRows = 0;

  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r] ?? [];
    const linkRaw = cells[colLink];
    const url = normalizeMosActivityUrl(linkRaw);
    if (!url) {
      skippedRows++;
      continue;
    }

    if (colPrice >= 0) {
      const priceRaw = cells[colPrice];
      const priceDigits = String(priceRaw ?? "")
        .replace(/[^\d]/g, "");
      if (priceDigits === "0") {
        skippedRows++;
        continue;
      }
    }

    const enrolled = parseEnrolledCell(cells[colEnrolled]);
    const sheetRow = r + 1;
    const entry = {
      sheetRow,
      shiftGroupId: colShift >= 0 ? String(cells[colShift] ?? "").trim() : "",
      formatType: colFormat >= 0 ? String(cells[colFormat] ?? "").trim() : "",
      enrolled,
      enrolledCol: colEnrolled,
    };

    const bucket = byUrl.get(url);
    if (bucket) {
      bucket.rows.push(entry);
    } else {
      byUrl.set(url, { url, rows: [entry] });
    }
  }

  return { headers, byUrl, skippedRows };
}

export function columnLetter(index) {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * @param {number} baseMs
 */
function urlDelayWithJitter(baseMs) {
  if (baseMs <= 0) return 0;
  const jitter = Math.floor(Math.random() * 201) - 50;
  return Math.max(0, baseMs + jitter);
}

function fetchConcurrency() {
  const n = Number(process.env.MOS_ENROLLED_FETCH_CONCURRENCY || 4);
  if (!Number.isFinite(n) || n < 1) return 4;
  return Math.min(Math.round(n), 8);
}

/**
 * @param {{ root: string, dryRun?: boolean, force?: boolean, onProgress?: (msg: string) => void }} options
 */
export async function syncMosEnrolledFromPortal(options) {
  const { root, dryRun = false, force = false, onProgress } = options;
  const gate = mosEnrolledSyncEnabled(root);
  if (!gate.enabled && !force) {
    return {
      ok: true,
      skipped: true,
      reason: gate.reason,
      urls: 0,
      updatedRows: 0,
      unchanged: 0,
      errors: [],
    };
  }

  mosSyncDebug("sync start", { dryRun, force, root });
  const cookieMeta = await initMosCookieSession(root);
  onProgress?.(
    cookieMeta.count > 0
      ? `[mos-enrolled] cookies: ${cookieMeta.count} key(s) from ${cookieMeta.source} (optional)`
      : cookieMeta.source === "skip-s3"
        ? `[mos-enrolled] cookies: none — public API (S3 cookie load skipped)`
        : `[mos-enrolled] cookies: none — public groups API without session`,
  );

  const token = await getToken();
  const { spreadsheetId, range } = hotConfig();
  const grid = await fetchFormatsGrid(token, spreadsheetId, range);
  const { byUrl, skippedRows } = collectFormatsByMosUrl(grid);

  const delayMs = Number(process.env.MOS_ENROLLED_URL_DELAY_MS || 400);
  const errors = [];
  let authAlertSent = false;
  let updatedRows = 0;
  let unchanged = 0;
  /** @type {{ range: string, value: string }[]} */
  const pendingWrites = [];
  /** @type {Array<{ url: string, before: number | null, after: number, delta: number, rows: { shiftGroupId: string, formatType: string }[] }>} */
  const changes = [];

  const runId = newSyncRunId();
  const [loadedSnapshot, loadedSyncState] = await Promise.all([
    loadEnrolledSnapshotWithMeta(),
    loadSyncStateWithMeta(),
  ]);
  const prevSnapshot = loadedSnapshot.snapshot;
  const snapshotReadOk = loadedSnapshot.readOk;
  if (!snapshotReadOk) {
    onProgress?.(
      "[mos-enrolled] WARN enrolled snapshot S3 read failed (timeout?) — deltas may be wrong",
    );
  }
  /** @type {Record<string, { enrolled: number, shiftGroupId: string, formatType: string }>} */
  const nextSnapshot = { ...prevSnapshot };
  const syncState = loadedSyncState.state;
  const periodStart = syncState.lastSyncAt;
  const periodEnd = new Date().toISOString();

  const urls = [...byUrl.keys()].sort();
  onProgress?.(`[mos-enrolled] ${urls.length} unique mos.ru URL(s), ${skippedRows} row(s) without link`);
  const syncStartedAt = Date.now();
  const concurrency = fetchConcurrency();
  mosSyncTrace("H2", "mos-enrolled-sync.mjs:urls", "url loop start", {
    urlCount: urls.length,
    delayMs,
    concurrency,
    dryRun,
  });

  /**
   * @param {string} url
   */
  async function processOneUrl(url) {
    const bucket = byUrl.get(url);
    if (!bucket) return;

    const hotTotal = hotEnrolledTotalForUrl(
      bucket.rows.map((row) => ({ enrolled: row.enrolled })),
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
          rows: bucket.rows.map((row) => ({
            shiftGroupId: row.shiftGroupId,
            formatType: row.formatType,
          })),
        });
      } else if (delta < 0 && !dryRun) {
        for (const row of bucket.rows) {
          await appendEnrolledEvent({
            at: periodEnd,
            type: "enrolled_decrease",
            shiftGroupId: row.shiftGroupId,
            formatType: row.formatType,
            mosUrl: url,
            before,
            after: mos.count,
            delta,
            syncRunId: runId,
          });
        }
      }

      const row = bucket.rows[0];
      nextSnapshot[url] = {
        enrolled: mos.count,
        shiftGroupId: row?.shiftGroupId ?? "",
        formatType: row?.formatType ?? "",
      };

      const same =
        typeof hotTotal === "number" &&
        hotTotal === mos.count &&
        bucket.rows.every((row) => row.enrolled === mos.count);

      if (same) {
        unchanged += bucket.rows.length;
        onProgress?.(
          `[mos-enrolled] OK ${url} → ${mos.count} (HOT matches, ${bucket.rows.length} row(s))`,
        );
        return;
      }

      onProgress?.(
        `[mos-enrolled] ${dryRun ? "would update" : "update"} ${url}: mos=${mos.count} (${mos.source}), HOT=${hotTotal ?? "—"} → ${bucket.rows.length} row(s)`,
      );

      for (const row of bucket.rows) {
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
      onProgress?.(`[mos-enrolled] ERROR ${url}: ${msg}`);
      if (!authAlertSent && /blocked HTTP|401|403|mos\.ru/i.test(msg)) {
        authAlertSent = true;
        await notifyMosCookiesExpired(msg);
      }
    }
  }

  for (let i = 0; i < urls.length; i += concurrency) {
    if (i > 0 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, urlDelayWithJitter(delayMs)));
    }
    const chunk = urls.slice(i, i + concurrency);
    await Promise.all(chunk.map((url) => processOneUrl(url)));
  }

  mosSyncTrace("H2", "mos-enrolled-sync.mjs:after-urls", "url loop done", {
    elapsedMs: Date.now() - syncStartedAt,
    errors: errors.length,
    pendingWrites: pendingWrites.length,
  });

  if (!dryRun && pendingWrites.length > 0) {
    mosSyncTrace("H2", "mos-enrolled-sync.mjs:sheet", "batchWriteCells start", {
      cells: pendingWrites.length,
    });
    await batchWriteCells(token, spreadsheetId, pendingWrites);
    mosSyncTrace("H2", "mos-enrolled-sync.mjs:sheet", "batchWriteCells done", {
      elapsedMs: Date.now() - syncStartedAt,
    });
  }

  const cookieSave = await persistMosCookieSession(root);
  if (cookieSave.saved) {
    onProgress?.(`[mos-enrolled] cookies saved → ${cookieSave.target}`);
  } else if (cookieSave.skipped && cookieSave.reason === "persistence_disabled") {
    mosSyncDebug("[mos-enrolled] cookie persist skipped (YCF public API mode)");
  } else if (!cookieSave.skipped && cookieSave.reason === "write_failed") {
    onProgress?.("[mos-enrolled] WARN cookies not saved (S3/local write failed)");
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
      if (!authAlertSent) {
        await maybeSendEnrolledDigest(eventSummary, {
          periodStart,
          periodEnd,
          visits1h: traffic.visits1h,
          intervalSec: syncState.lastIntervalSec,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onProgress?.(`[mos-enrolled] events/TG skipped (S3): ${msg}`);
    }
  }

  let snapshotOk = true;
  let stateOk = true;
  if (!dryRun) {
    mosSyncTrace("H3", "mos-enrolled-sync.mjs:snapshot", "saveEnrolledSnapshot start", {
      elapsedMs: Date.now() - syncStartedAt,
      urlKeys: Object.keys(nextSnapshot).length,
    });
    snapshotOk = await saveEnrolledSnapshot(nextSnapshot);
    mosSyncTrace("H3", "mos-enrolled-sync.mjs:snapshot", "saveEnrolledSnapshot done", {
      snapshotOk,
      elapsedMs: Date.now() - syncStartedAt,
    });
    if (!snapshotOk) {
      onProgress?.(
        "[mos-enrolled] WARN enrolled snapshot not saved (S3)",
      );
    }
    mosSyncTrace("H3", "mos-enrolled-sync.mjs:state", "onSyncFinished start", {
      elapsedMs: Date.now() - syncStartedAt,
    });
    const finish = await onSyncFinished(
      {
        ok,
        hadChanges: (updatedRows ?? 0) > 0,
        runId,
      },
      syncState,
    );
    mosSyncTrace("H3", "mos-enrolled-sync.mjs:state", "onSyncFinished done", {
      stateOk: finish.stateOk,
      elapsedMs: Date.now() - syncStartedAt,
    });
    stateOk = finish.stateOk === true;
    if (stateOk) {
      onProgress?.(
        `[mos-enrolled] state saved, nextDueAt=${finish.nextDueAt ?? "?"}`,
      );
    } else {
      onProgress?.(
        "[mos-enrolled] WARN mos-sync-state not saved (S3) — lastSyncAt missing",
      );
    }
  }

  return {
    ok,
    skipped: false,
    reason: gate.reason,
    urls: urls.length,
    updatedRows: dryRun ? 0 : updatedRows,
    wouldUpdateRows: dryRun ? pendingWrites.length : undefined,
    unchanged,
    errors,
    spreadsheetId,
    runId,
    changes,
    stateOk,
    snapshotOk,
    snapshotReadOk,
    cookieSave,
    enrolledDeltaSum: eventSummary?.deltaSum ?? 0,
  };
}
