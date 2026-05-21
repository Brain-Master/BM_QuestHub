#!/usr/bin/env node
/**
 * Create "Ops" sheet tab + header row in the leads spreadsheet (Editor on file required).
 *
 *   node scripts/setup-ops-sheet.mjs
 *   GOOGLE_SHEETS_LEADS_SPREADSHEET_ID=... node scripts/setup-ops-sheet.mjs
 *
 * Loads credentials from scripts/sheets.env and apps/web/.env.local (same as seed-google-sheet-headers).
 */
import { GoogleAuth } from "google-auth-library";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

/** Same spreadsheet as bm-lead-receiver (GOOGLE_SHEETS_SPREADSHEET_ID). */
const DEFAULT_LEADS_ID = "10FzJzrZlZCTOI6namzfMK8cmEXek7U8jRwO9BB2LA7s";
const OPS_SHEET_TITLE = "Ops";
const OPS_RANGE = "Ops!A:M";

const OPS_HEADERS = [
  "receivedAt",
  "occurredAt",
  "requestId",
  "event",
  "source",
  "httpStatus",
  "errorCode",
  "errorMessage",
  "issues",
  "parentName",
  "contact",
  "questTitle",
  "offerId",
];

function loadCredentials() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON required (scripts/sheets.env or apps/web/.env.local)");
  }
  return JSON.parse(inline);
}

async function getAuthToken() {
  const auth = new GoogleAuth({
    credentials: loadCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("no access token");
  return token.token;
}

async function ensureSheetTitles(spreadsheetId, titles, token) {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) {
    throw new Error(`metadata ${metaRes.status}: ${await metaRes.text()}`);
  }
  const meta = await metaRes.json();
  const existing = new Set(
    (meta.sheets ?? []).map((s) => s.properties?.title).filter(Boolean),
  );
  const requests = [];
  for (const title of titles) {
    if (!existing.has(title)) {
      requests.push({ addSheet: { properties: { title } } });
    }
  }
  if (requests.length === 0) return false;
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const batchRes = await fetch(batchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  if (!batchRes.ok) {
    throw new Error(`batchUpdate ${batchRes.status}: ${await batchRes.text()}`);
  }
  console.log(
    `[ops-sheet] created tab(s): ${titles.filter((t) => !existing.has(t)).join(", ")}`,
  );
  return true;
}

async function writeRow(spreadsheetId, range, values, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });
  if (!res.ok) {
    throw new Error(`values.put ${range} ${res.status}: ${await res.text()}`);
  }
  console.log(`[ops-sheet] headers → ${range}`);
}

async function readFirstDataRow(spreadsheetId, token) {
  const range = `${OPS_SHEET_TITLE}!A2:M`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`values.get ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.values?.[0] ?? null;
}

async function main() {
  const spreadsheetId =
    process.env.GOOGLE_SHEETS_LEADS_SPREADSHEET_ID?.trim() ||
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ||
    DEFAULT_LEADS_ID;

  const token = await getAuthToken();
  await ensureSheetTitles(spreadsheetId, [OPS_SHEET_TITLE], token);
  await writeRow(spreadsheetId, `${OPS_SHEET_TITLE}!A1:M1`, OPS_HEADERS, token);

  console.log(`[ops-sheet] spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
  console.log(`[ops-sheet] set on bm-lead-ops-reporter: GOOGLE_OPS_SHEET_RANGE=${OPS_RANGE}`);

  return { spreadsheetId, opsRange: OPS_RANGE };
}

main().catch((err) => {
  console.error("[ops-sheet]", err.message || err);
  process.exit(1);
});
