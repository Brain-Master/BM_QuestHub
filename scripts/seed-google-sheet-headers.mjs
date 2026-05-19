#!/usr/bin/env node
/**
 * Write header row 1 to hot/cold spreadsheets (requires spreadsheets scope).
 * Usage: node scripts/seed-google-sheet-headers.mjs
 *
 * Uses Google Sheets API batchUpdate — service account must be Editor on both files.
 */
import { GoogleAuth } from "google-auth-library";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

const HOT_ID =
  process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
  "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";
const COLD_ID =
  process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() ||
  "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc";

const HOT_HEADERS = [
  "program_name",
  "quest_slug",
  "venue_slug",
  "start_date",
  "end_date",
  "start_time",
  "end_time",
  "price",
  "school_name",
  "address",
  "status",
  "metro_station",
  "teacher",
  "age_group",
  "mos_ru_code",
  "mos_ru_link",
  "max_capacity",
  "enrolled",
  "notes",
  "registration_channel",
  "display_title",
  "description",
];

const COLD_SHEETS = {
  Миры: [
    "slug",
    "name",
    "description",
    "theme_key",
    "tagline",
    "pitch",
    "highlights",
    "hero_video_url",
    "hero_image_url",
    "card_gradient",
    "card_glow",
    "icon_key",
  ],
  Площадки: [
    "slug",
    "name",
    "display_name",
    "type",
    "address",
    "metro",
    "city",
    "district",
    "latitude",
    "longitude",
    "school_scope_slug",
    "listed_on_sites",
    "logo_url",
    "directions",
    "entrance_note",
    "contact_note",
  ],
  Курсы: [
    "slug",
    "world_slug",
    "title",
    "tagline",
    "catalog_tagline",
    "age_label",
    "format",
    "skills",
    "active_in_campaign",
    "hero_image_url",
    "hero_video_url",
    "group_size",
    "duration_label",
    "price_hint",
    "story",
    "skills_parent",
    "loot",
    "approach",
  ],
};

function loadCredentials() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON required");
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
  if (requests.length === 0) return;
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
  console.log(`[seed] created sheets on ${spreadsheetId}: ${titles.filter((t) => !existing.has(t)).join(", ")}`);
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
  console.log(`[seed] ${spreadsheetId} ${range}`);
}

async function main() {
  const token = await getAuthToken();
  await ensureSheetTitles(HOT_ID, ["Расписание"], token);
  await writeRow(HOT_ID, "'Расписание'!A1", HOT_HEADERS, token);

  await ensureSheetTitles(COLD_ID, Object.keys(COLD_SHEETS), token);
  for (const [title, headers] of Object.entries(COLD_SHEETS)) {
    await writeRow(COLD_ID, `'${title}'!A1`, headers, token);
  }
  console.log("[seed] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
