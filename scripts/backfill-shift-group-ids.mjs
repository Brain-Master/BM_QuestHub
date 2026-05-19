#!/usr/bin/env node
/**
 * Fill shift_group_id column on Hot sheet «Группы» (row 2+).
 * Usage: node scripts/backfill-shift-group-ids.mjs [--dry-run]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GoogleAuth } from "google-auth-library";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

const HOT_ID =
  process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
  "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";

const SHEET = "Группы";
const RANGE = `'${SHEET}'!A1:AZ`;

function normalizeHeader(raw) {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function buildShiftGroupId(row) {
  const explicit = String(row.shift_group_id ?? "").trim();
  if (explicit) return explicit;
  return `${row.quest_slug}:${row.venue_slug}:${row.start_date}:${row.end_date}`;
}

function loadCredentials() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON required");
  return JSON.parse(inline);
}

async function getToken() {
  const auth = new GoogleAuth({
    credentials: loadCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("no access token");
  return token.token;
}

async function fetchGrid(token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(HOT_ID)}/values/${encodeURIComponent(RANGE)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.values ?? [];
}

async function writeColumn(token, values) {
  const range = `'${SHEET}'!A2:A${1 + values.length}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(HOT_ID)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: values.map((v) => [v]),
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const token = await getToken();
  const grid = await fetchGrid(token);
  if (grid.length < 2) {
    console.log("[backfill] no data rows");
    return;
  }

  const headers = grid[0].map(normalizeHeader);
  const idx = (name) => headers.indexOf(name);

  const colGroup = idx("shift_group_id");
  const colQuest = idx("quest_slug");
  const colVenue = idx("venue_slug");
  const colStart = idx("start_date");
  const colEnd = idx("end_date");

  if (colQuest < 0 || colVenue < 0 || colStart < 0 || colEnd < 0) {
    throw new Error("Missing quest_slug/venue_slug/start_date/end_date columns");
  }

  const out = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const row = {
      shift_group_id: colGroup >= 0 ? cells[colGroup] : "",
      quest_slug: cells[colQuest] ?? "",
      venue_slug: cells[colVenue] ?? "",
      start_date: cells[colStart] ?? "",
      end_date: cells[colEnd] ?? "",
    };
    if (
      !String(row.quest_slug).trim() &&
      !String(row.venue_slug).trim()
    ) {
      out.push("");
      continue;
    }
    out.push(buildShiftGroupId(row));
  }

  if (dryRun) {
    console.log("[backfill] dry-run, first 5 ids:", out.slice(0, 5));
    return;
  }

  if (colGroup < 0) {
    console.log(
      "[backfill] shift_group_id column missing — run make seed-sheet-headers first",
    );
    return;
  }

  await writeColumn(token, out);
  console.log(`[backfill] wrote ${out.length} shift_group_id values on «${SHEET}»`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
