#!/usr/bin/env node
/**
 * Copy Cold tab data from backup spreadsheet into current Cold,
 * mapping columns by header name and keeping destination header row.
 *
 * Usage:
 *   node scripts/restore-cold-from-backup.mjs [--dry-run]
 */
import { GoogleAuth } from "google-auth-library";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(`${ROOT}/scripts/sheets.env`);

const BACKUP_ID = "1tYcTJ5_UL2ZnyNqR--zudAtHNB70mD6LqZ94owmfMLU";
const DEST_ID =
  process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() ||
  "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc";

const TABS = ["Миры", "Площадки", "Курсы"];

/** Legacy backup headers → current cold contract columns. */
const LEGACY_HEADER_ALIASES = {
  hero_video_url: "hero_video_embed_url",
  hero_video_file_url: "hero_video_embed_url",
};

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
  const srcNorm = sourceHeaders.map(norm);
  const destNorm = destHeaders.map(norm);
  const slugIdx = srcNorm.indexOf("slug");

  const indexByNorm = new Map();
  for (let i = 0; i < srcNorm.length; i++) {
    const key = srcNorm[i];
    if (!key) continue;
    const canonical = LEGACY_HEADER_ALIASES[key] ?? key;
    if (!indexByNorm.has(canonical)) indexByNorm.set(canonical, i);
  }

  const mapped = [];
  for (const srcRow of sourceRows) {
    if (isSkippableRow(srcRow, slugIdx)) continue;
    const out = destNorm.map((col) => {
      if (!col) return "";
      const idx = indexByNorm.get(col);
      if (idx === undefined) return "";
      return srcRow[idx] === undefined || srcRow[idx] === null ? "" : String(srcRow[idx]);
    });
    mapped.push(out);
  }
  return mapped;
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
  const dryRun = process.argv.includes("--dry-run");
  const token = await getToken();

  console.log(`Backup: ${BACKUP_ID}`);
  console.log(`Target: ${DEST_ID}`);
  if (dryRun) console.log("(dry-run — no writes)\n");

  for (const tab of TABS) {
    const [src, dest] = await Promise.all([
      fetchSheetValues(BACKUP_ID, tab, token),
      fetchSheetValues(DEST_ID, tab, token),
    ]);

    const destHeaders = dest.rawHeaders.length ? dest.rawHeaders : src.rawHeaders;
    const mapped = mapRowsToDestHeaders(src.dataRows, src.rawHeaders, destHeaders);

    const srcNorm = src.rawHeaders.map(norm).filter(Boolean);
    const destNorm = destHeaders.map(norm).filter(Boolean);
    const onlyInSrc = srcNorm.filter((h) => !destNorm.includes(h));
    const onlyInDest = destNorm.filter((h) => !srcNorm.includes(h));

    console.log(`\n=== ${tab} ===`);
    console.log(`  backup rows: ${src.dataRows.length}`);
    console.log(`  target headers (${destNorm.length}): ${destNorm.join(", ")}`);
    if (onlyInSrc.length) console.log(`  backup-only columns (dropped): ${onlyInSrc.join(", ")}`);
    if (onlyInDest.length) console.log(`  target-only columns (empty): ${onlyInDest.join(", ")}`);

    if (!dryRun) {
      await writeData(DEST_ID, tab, destHeaders, mapped, token);
    } else {
      console.log(`  would write ${mapped.length} rows`);
    }
  }

  console.log(dryRun ? "\n[dry-run] done" : "\n[restore] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
