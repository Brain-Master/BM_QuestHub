#!/usr/bin/env node
/**
 * Copy Cold tab data from backup spreadsheet into current Cold.
 *
 * Modes:
 *   (default)       Replace data rows; map columns by header; keep destination header row.
 *   --merge-design  Keep Cold text/structure; overlay presentation columns from backup by slug.
 *   --tabs=a,b      Limit to tab names (comma-separated), e.g. --tabs=Курсы,Миры
 *   --dry-run       Print plan only
 *
 * Usage:
 *   node scripts/restore-cold-from-backup.mjs [--merge-design] [--tabs=Курсы] [--dry-run]
 */
import { GoogleAuth } from "google-auth-library";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(`${ROOT}/scripts/sheets.env`);

const BACKUP_ID = "1tYcTJ5_UL2ZnyNqR--zudAtHNB70mD6LqZ94owmfMLU";
const DEST_ID =
  process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() ||
  "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc";

const ALL_TABS = ["Миры", "Площадки", "Курсы"];

/** Columns merged from backup (by slug). */
const DESIGN_COLUMNS = {
  Миры: [
    "theme_key",
    "tagline",
    "pitch",
    "highlights",
    "hero_video_embed_url",
    "card_gradient",
    "card_glow",
    "icon_key",
  ],
  Площадки: [],
  Курсы: [
    "tagline",
    "catalog_tagline",
    "hero_video_embed_url",
    "group_size",
    "duration_label",
    "price_hint",
  ],
};

/** Always take backup value when set (legacy hero_video_url maps here). */
const DESIGN_OVERWRITE = new Set([
  "theme_key",
  "hero_video_embed_url",
  "card_gradient",
  "card_glow",
  "icon_key",
]);

/** Legacy backup headers → current cold contract columns. */
const LEGACY_HEADER_ALIASES = {
  hero_video_url: "hero_video_embed_url",
  hero_video_file_url: "hero_video_embed_url",
};

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const mergeDesign = argv.includes("--merge-design");
  const tabsArg = argv.find((a) => a.startsWith("--tabs="));
  const tabs = tabsArg
    ? tabsArg
        .slice("--tabs=".length)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : ALL_TABS;
  const unknown = tabs.filter((t) => !ALL_TABS.includes(t));
  if (unknown.length) {
    throw new Error(`Unknown tabs: ${unknown.join(", ")}. Use: ${ALL_TABS.join(", ")}`);
  }
  return { dryRun, mergeDesign, tabs };
}

function norm(h) {
  return String(h)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function columnLetter(n) {
  let s = "";
  let x = n;
  while (x > 0) {
    const r = (x - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function isBlankRow(cells) {
  return cells.every((c) => !String(c).trim());
}

function isSkippableRow(cells, slugIdx) {
  if (isBlankRow(cells)) return true;
  if (slugIdx < 0) return false;
  return !String(cells[slugIdx] ?? "").trim();
}

function buildSourceIndex(sourceHeaders) {
  const srcNorm = sourceHeaders.map(norm);
  /** canonical column → all source indices (legacy aliases may duplicate a target). */
  const indicesByNorm = new Map();
  for (let i = 0; i < srcNorm.length; i++) {
    const key = srcNorm[i];
    if (!key) continue;
    const canonical = LEGACY_HEADER_ALIASES[key] ?? key;
    const list = indicesByNorm.get(canonical) ?? [];
    list.push(i);
    indicesByNorm.set(canonical, list);
  }
  return { srcNorm, indicesByNorm };
}

function readSourceCell(srcRow, col, indicesByNorm) {
  const indices = indicesByNorm.get(col) ?? [];
  for (const idx of indices) {
    const v = srcRow[idx];
    const s = v === undefined || v === null ? "" : String(v).trim();
    if (s) return s;
  }
  return "";
}

async function getToken() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing");
  const auth = new GoogleAuth({
    credentials: JSON.parse(json),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("no access token");
  return token;
}

async function sheetsGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return JSON.parse(text);
}

async function sheetsPost(url, token, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function sheetsPut(url, token, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return JSON.parse(text);
}

async function fetchSheetValues(spreadsheetId, tab, token) {
  const range = encodeURIComponent(`'${tab}'`);
  const data = await sheetsGet(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    token,
  );
  const rows = data.values ?? [];
  const rawHeaders = rows[0] ?? [];
  const destNorm = rawHeaders.map(norm);
  const dataRows = rows.slice(1).filter((r) => !isBlankRow(r));
  return { rawHeaders, destNorm, dataRows };
}

function mapRowsToDestHeaders(sourceRows, sourceHeaders, destHeaders) {
  const { indicesByNorm } = buildSourceIndex(sourceHeaders);
  const destNorm = destHeaders.map(norm);
  const slugIdx = sourceHeaders.map(norm).indexOf("slug");

  const mapped = [];
  for (const srcRow of sourceRows) {
    if (isSkippableRow(srcRow, slugIdx)) continue;
    const out = destNorm.map((col) => {
      if (!col) return "";
      return readSourceCell(srcRow, col, indicesByNorm);
    });
    mapped.push(out);
  }
  return mapped;
}

function mergeDesignRows(destRows, destHeaders, sourceRows, sourceHeaders, designCols) {
  const destNorm = destHeaders.map(norm);
  const { indicesByNorm } = buildSourceIndex(sourceHeaders);
  const slugIdx = destNorm.indexOf("slug");

  const srcBySlug = new Map();
  const srcSlugIdx = sourceHeaders.map(norm).indexOf("slug");
  for (const row of sourceRows) {
    if (isSkippableRow(row, srcSlugIdx)) continue;
    srcBySlug.set(String(row[srcSlugIdx] ?? "").trim(), row);
  }

  let patched = 0;
  const merged = destRows.map((destRow) => {
    if (isSkippableRow(destRow, slugIdx)) return [...destRow];
    const slug = String(destRow[slugIdx] ?? "").trim();
    const srcRow = srcBySlug.get(slug);
    if (!srcRow) return [...destRow];

    const out = [...destRow];
    let rowChanged = false;
    for (const col of designCols) {
      const colIdx = destNorm.indexOf(col);
      if (colIdx < 0) continue;
      const fromBackup = readSourceCell(srcRow, col, indicesByNorm);
      if (!fromBackup) continue;
      const before = String(out[colIdx] ?? "").trim();
      const useBackup = DESIGN_OVERWRITE.has(col) ? true : !before;
      if (!useBackup || before === fromBackup) continue;
      out[colIdx] = fromBackup;
      rowChanged = true;
    }
    if (rowChanged) patched += 1;
    return out;
  });

  return { merged, patched };
}

async function clearDataRange(spreadsheetId, tab, lastCol, token) {
  const range = encodeURIComponent(`'${tab}'!A2:Z`);
  await sheetsPost(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`,
    token,
  );
  const narrow = encodeURIComponent(`'${tab}'!A2:${lastCol}`);
  await sheetsPost(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${narrow}:clear`,
    token,
  );
}

async function writeData(spreadsheetId, tab, headers, dataRows, token) {
  const lastCol = columnLetter(headers.length);
  await clearDataRange(spreadsheetId, tab, lastCol, token);
  if (dataRows.length === 0) {
    console.log(`  ${tab}: 0 rows written`);
    return;
  }
  const range = encodeURIComponent(`'${tab}'!A2:${lastCol}${1 + dataRows.length}`);
  await sheetsPut(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    token,
    { values: dataRows },
  );
  console.log(`  ${tab}: ${dataRows.length} rows written (${headers.length} columns)`);
}

async function main() {
  const { dryRun, mergeDesign, tabs } = parseArgs(process.argv.slice(2));
  const token = await getToken();

  console.log(`Backup: ${BACKUP_ID}`);
  console.log(`Target: ${DEST_ID}`);
  console.log(`Mode: ${mergeDesign ? "merge-design (by slug)" : "full replace"}`);
  console.log(`Tabs: ${tabs.join(", ")}`);
  if (dryRun) console.log("(dry-run — no writes)\n");

  for (const tab of tabs) {
    const [src, dest] = await Promise.all([
      fetchSheetValues(BACKUP_ID, tab, token),
      fetchSheetValues(DEST_ID, tab, token),
    ]);

    const destHeaders = dest.rawHeaders.length ? dest.rawHeaders : src.rawHeaders;
    const destNorm = destHeaders.map(norm).filter(Boolean);
    const srcNorm = src.rawHeaders.map(norm).filter(Boolean);

    let outRows;
    let patched = 0;
    if (mergeDesign) {
      const designCols = (DESIGN_COLUMNS[tab] ?? []).filter((c) => destNorm.includes(c));
      const result = mergeDesignRows(
        dest.dataRows,
        destHeaders,
        src.dataRows,
        src.rawHeaders,
        designCols,
      );
      outRows = result.merged;
      patched = result.patched;
    } else {
      outRows = mapRowsToDestHeaders(src.dataRows, src.rawHeaders, destHeaders);
    }

    const onlyInSrc = srcNorm.filter((h) => !destNorm.includes(h));
    const onlyInDest = destNorm.filter((h) => !srcNorm.includes(h));

    console.log(`\n=== ${tab} ===`);
    console.log(`  backup rows: ${src.dataRows.length}`);
    console.log(`  target rows: ${dest.dataRows.length}`);
    console.log(`  target headers (${destNorm.length}): ${destNorm.join(", ")}`);
    if (onlyInSrc.length) console.log(`  backup-only columns (dropped): ${onlyInSrc.join(", ")}`);
    if (onlyInDest.length) console.log(`  target-only columns (kept from Cold): ${onlyInDest.join(", ")}`);
    if (mergeDesign) {
      console.log(`  design columns: ${(DESIGN_COLUMNS[tab] ?? []).join(", ") || "(none)"}`);
      console.log(`  rows to patch: ${patched}`);
    }

    if (!dryRun) {
      await writeData(DEST_ID, tab, destHeaders, outRows, token);
    } else {
      console.log(`  would write ${outRows.length} rows`);
    }
  }

  console.log(dryRun ? "\n[dry-run] done" : "\n[restore] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
