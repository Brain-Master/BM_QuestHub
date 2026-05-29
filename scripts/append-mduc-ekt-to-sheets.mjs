#!/usr/bin/env node
/**
 * Append MDUC EKT venues (Cold) and summer shifts (Hot) to Google Sheets.
 * Idempotent: skips rows whose slug / shift_group_id already exist.
 *
 * Usage: node scripts/append-mduc-ekt-to-sheets.mjs [--dry-run]
 */
import path from "node:path";

import { GoogleAuth } from "google-auth-library";

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

const DRY_RUN = process.argv.includes("--dry-run");

const VENUE_HEADERS = [
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
  "directions",
  "entrance_note",
  "contact_note",
];

const HOT_GROUP_HEADERS = [
  "shift_group_id",
  "program_name_h1",
  "program_name_h2",
  "quest_slug",
  "venue_slug",
  "start_date",
  "end_date",
  "school_name",
  "address",
  "status",
  "metro_station",
  "teacher",
  "max_capacity",
  "notes",
  "description",
  "tags",
  "is_archived",
  "allow_waitlist_when_sold_out",
];

const HOT_FORMAT_HEADERS = [
  "shift_group_id",
  "start_time",
  "end_time",
  "price",
  "format_type",
  "format_note",
  "registration_channel",
  "enrolled",
  "mos_ru_code",
  "mos_ru_link",
  "age_group",
  "allow_preliminary_registration",
];

const SCHOOL_NAME =
  'ГБОУДО «Московский детско-юношеский центр экологии, краеведения и туризма»';
const DISPLAY_NAME = "МДЮЦ ЭКТ";
const SCOPE = "mduc-ekt";

const ENTRANCE_NOTE =
  "Перед стартом смены подтвердим вход, место встречи и кабинет в корпусе.";
const CONTACT_NOTE =
  "Точный кабинет и порядок прохода отправляем родителям перед началом смены.";

function directionsFor(address) {
  return [
    `Постройте маршрут до ${address} и ориентируйтесь на главный вход.`,
    "На входе скажите, что вы на занятия BrainMaster.",
    "Дождитесь координатора BrainMaster в согласованной зоне встречи.",
  ].join("\n");
}

const COLD_VENUES = [
  {
    slug: "mduc-ekt-odesskaya",
    address: "ул. Одесская, 12А",
    metro: "Каховская",
    district: "Зюзино",
    latitude: "55.6539",
    longitude: "37.5984",
  },
  {
    slug: "mduc-ekt-mosfilmovskaya",
    address: "ул. Мосфильмовская, 55к1",
    metro: "Минская",
    district: "Раменки",
    latitude: "55.7092",
    longitude: "37.4988",
  },
].map((v) => [
  v.slug,
  SCHOOL_NAME,
  DISPLAY_NAME,
  "school",
  v.address,
  v.metro,
  "moscow",
  v.district,
  v.latitude,
  v.longitude,
  SCOPE,
  "да",
  directionsFor(v.address),
  ENTRANCE_NOTE,
  CONTACT_NOTE,
]);

const HOT_GROUPS = [
  {
    id: "minecraft-taina-drevnih-inzhenerov:mduc-ekt-odesskaya:2026-06-15:2026-06-19",
    h1: "Minecraft",
    h2: "Тайна Древних Инженеров",
    quest: "minecraft-taina-drevnih-inzhenerov",
    venue: "mduc-ekt-odesskaya",
    start: "2026-06-15",
    end: "2026-06-19",
    address: "ул. Одесская, 12А",
    metro: "Каховская",
  },
  {
    id: "minecraft-probuzhdenie-strazhey:mduc-ekt-odesskaya:2026-06-22:2026-06-26",
    h1: "Minecraft",
    h2: "Пробуждение Стражей",
    quest: "minecraft-probuzhdenie-strazhey",
    venue: "mduc-ekt-odesskaya",
    start: "2026-06-22",
    end: "2026-06-26",
    address: "ул. Одесская, 12А",
    metro: "Каховская",
  },
  {
    id: "mekhvarium-laboratoriya-kineticheskih-monstrov:mduc-ekt-mosfilmovskaya:2026-06-15:2026-06-19",
    h1: "Мехвариум",
    h2: "Лаборатория Кинетических Монстров",
    quest: "mekhvarium-laboratoriya-kineticheskih-monstrov",
    venue: "mduc-ekt-mosfilmovskaya",
    start: "2026-06-15",
    end: "2026-06-19",
    address: "ул. Мосфильмовская, 55к1",
    metro: "Минская",
  },
  {
    id: "mekhvarium-masterskaya-gidravlicheskih-monstrov:mduc-ekt-mosfilmovskaya:2026-06-22:2026-06-26",
    h1: "Мехвариум",
    h2: "Мастерская Гидравлических Монстров",
    quest: "mekhvarium-masterskaya-gidravlicheskih-monstrov",
    venue: "mduc-ekt-mosfilmovskaya",
    start: "2026-06-22",
    end: "2026-06-26",
    address: "ул. Мосфильмовская, 55к1",
    metro: "Минская",
  },
].map((g) => [
  g.id,
  g.h1,
  g.h2,
  g.quest,
  g.venue,
  g.start,
  g.end,
  DISPLAY_NAME,
  g.address,
  "Идёт набор",
  g.metro,
  "",
  "12",
  "",
  "",
  "Офлайн;Интенсив (полдня)",
  "нет",
  "да",
]);

const FORMAT_NOTE =
  "Электроника и расходники включены. Камерный формат: до 12 человек.";

const HOT_FORMATS = [
  {
    id: "minecraft-taina-drevnih-inzhenerov:mduc-ekt-odesskaya:2026-06-15:2026-06-19",
    code: "2451662",
    link: "https://www.mos.ru/pgu2/activity/card/853173",
  },
  {
    id: "minecraft-probuzhdenie-strazhey:mduc-ekt-odesskaya:2026-06-22:2026-06-26",
    code: "2451687",
    link: "https://www.mos.ru/pgu2/activity/card/853210",
  },
  {
    id: "mekhvarium-laboratoriya-kineticheskih-monstrov:mduc-ekt-mosfilmovskaya:2026-06-15:2026-06-19",
    code: "2451655",
    link: "https://www.mos.ru/pgu2/activity/card/853150",
  },
  {
    id: "mekhvarium-masterskaya-gidravlicheskih-monstrov:mduc-ekt-mosfilmovskaya:2026-06-22:2026-06-26",
    code: "2451690",
    link: "https://www.mos.ru/pgu2/activity/card/853205",
  },
].map((f) => [
  f.id,
  "10:00",
  "13:30",
  "12950",
  "Интенсив (полдня)",
  FORMAT_NOTE,
  "", // enrolled
  f.code,
  f.link,
  "6–15 лет",
  "mos_ru",
  "нет",
]);

function normalizeHeader(raw) {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
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

async function fetchGrid(spreadsheetId, range, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.values ?? [];
}

function columnIndex(headers, name) {
  const norm = normalizeHeader(name);
  const idx = headers.map(normalizeHeader).indexOf(norm);
  if (idx === -1) throw new Error(`Column not found: ${name}`);
  return idx;
}

function existingKeys(grid, keyColumn) {
  if (grid.length < 2) return new Set();
  const headers = grid[0];
  const idx = columnIndex(headers, keyColumn);
  const keys = new Set();
  for (let i = 1; i < grid.length; i++) {
    const val = String(grid[i][idx] ?? "").trim();
    if (val) keys.add(val);
  }
  return keys;
}

async function appendRows(spreadsheetId, sheetTitle, rows, token) {
  if (rows.length === 0) return;
  const range = `'${sheetTitle}'!A:AZ`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: rows }),
  });
  if (!res.ok) throw new Error(`append ${sheetTitle} ${res.status}: ${await res.text()}`);
}

async function main() {
  const token = await getToken();

  const coldGrid = await fetchGrid(COLD_ID, "'Площадки'!A1:Z", token);
  const hotGroupsGrid = await fetchGrid(HOT_ID, "'Группы'!A1:AZ", token);
  const hotFormatsGrid = await fetchGrid(HOT_ID, "'Форматы'!A1:AZ", token);

  const existingVenueSlugs = existingKeys(coldGrid, "slug");
  const existingShiftIds = existingKeys(hotGroupsGrid, "shift_group_id");
  const existingFormatIds = existingKeys(hotFormatsGrid, "shift_group_id");

  const venuesToAdd = COLD_VENUES.filter((row) => !existingVenueSlugs.has(row[0]));
  const groupsToAdd = HOT_GROUPS.filter((row) => !existingShiftIds.has(row[0]));
  const formatsToAdd = HOT_FORMATS.filter((row) => !existingFormatIds.has(row[0]));

  console.log(`[append-mduc-ekt] Cold venues: +${venuesToAdd.length} (skip ${COLD_VENUES.length - venuesToAdd.length})`);
  console.log(`[append-mduc-ekt] Hot groups: +${groupsToAdd.length} (skip ${HOT_GROUPS.length - groupsToAdd.length})`);
  console.log(`[append-mduc-ekt] Hot formats: +${formatsToAdd.length} (skip ${HOT_FORMATS.length - formatsToAdd.length})`);

  if (DRY_RUN) {
    console.log("[append-mduc-ekt] dry-run — no writes");
    return;
  }

  if (venuesToAdd.length > 0) {
    await appendRows(COLD_ID, "Площадки", venuesToAdd, token);
    console.log("[append-mduc-ekt] Cold venues appended");
  }
  if (groupsToAdd.length > 0) {
    await appendRows(HOT_ID, "Группы", groupsToAdd, token);
    console.log("[append-mduc-ekt] Hot groups appended");
  }
  if (formatsToAdd.length > 0) {
    await appendRows(HOT_ID, "Форматы", formatsToAdd, token);
    console.log("[append-mduc-ekt] Hot formats appended");
  }

  console.log("[append-mduc-ekt] done");
}

main().catch((err) => {
  console.error("[append-mduc-ekt] failed:", err.message);
  process.exit(1);
});
