#!/usr/bin/env node
/**
 * Fill hot/cold Google Sheets from repo snapshots + YAML (row 2+).
 * Usage: node scripts/import-site-data-to-sheets.mjs [--hot-only] [--cold-only]
 */
import fs from "node:fs";
import path from "node:path";

import { GoogleAuth } from "google-auth-library";
import YAML from "yaml";

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
  "tags",
  "format_type",
  "format_time",
  "format_note",
  "is_archived",
  "allow_waitlist_when_sold_out",
];

const WEB = path.join(ROOT, "apps", "web");
const CONTENT = path.join(WEB, "content");

function loadCredentials() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON required (run make setup-sheets-env)");
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

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(WEB, rel), "utf8"));
}

function loadYamlDir(subdir) {
  const dir = path.join(CONTENT, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map((f) => YAML.parse(fs.readFileSync(path.join(dir, f), "utf8")));
}

function joinList(arr) {
  if (!arr?.length) return "";
  return arr.map((s) => String(s).trim()).filter(Boolean).join("|");
}

function joinLines(arr) {
  if (!arr?.length) return "";
  return arr.map((s) => String(s).trim()).filter(Boolean).join("\n");
}

function boolCell(v) {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

function parsePriceLabel(label) {
  if (!label) return "";
  const digits = String(label).replace(/\D/g, "");
  return digits || "";
}

function stripIncludedParts(note) {
  if (!note?.trim()) return "";
  return note
    .split(/\n\n+/)
    .filter((p) => !/^Возраст:/i.test(p) && !/^Код карточки mos\.ru:/i.test(p))
    .join("\n\n")
    .trim();
}

function questSlugFromOfferId(id) {
  const m = /^sheet:([^:]+):/.exec(id || "");
  return m?.[1] ?? "";
}

function buildVenueIndex() {
  const map = readJson("data/v2/map-snapshot.json");
  const bySlug = new Map();
  for (const v of map.venues ?? []) {
    bySlug.set(v.slug, v);
  }
  return bySlug;
}

function offerToRow(offer, questSlug, venueBySlug) {
  const sc = offer.scheduleCard ?? {};
  const venue = venueBySlug.get(offer.venueSlug) ?? {};
  const parts = (offer.shiftLabel ?? "").split(" · ");
  const schoolName = parts.length > 1 ? parts[parts.length - 1].trim() : "";
  const variant = sc.variants?.[0];
  const row = {
    program_name: sc.programFilterLabel ?? parts[0]?.trim() ?? "",
    quest_slug: questSlug,
    venue_slug: offer.venueSlug ?? "",
    start_date: offer.startDate ?? "",
    end_date: offer.endDate ?? "",
    start_time: offer.startTime ?? "",
    end_time: offer.endTime ?? "",
    price: parsePriceLabel(offer.priceLabel),
    school_name: schoolName,
    address: venue.address ?? "",
    status: offer.sheetStatus ?? sc.status ?? "",
    metro_station: venue.metro ?? "",
    teacher: sc.teacherName ?? "",
    age_group: sc.ageLabel ?? "",
    mos_ru_code: sc.mosRuCode ?? variant?.mosRuCode ?? "",
    mos_ru_link: offer.mosBookingUrl ?? variant?.mosBookingUrl ?? "",
    max_capacity:
      offer.maxCapacity === undefined ? "" : String(offer.maxCapacity),
    enrolled: offer.enrolled === undefined ? "" : String(offer.enrolled),
    notes: stripIncludedParts(offer.includedNote),
    registration_channel: sc.registrationChannel ?? "",
    display_title: sc.displayTitle ?? "",
    description: sc.description ?? "",
    tags: (sc.tags ?? []).join("; "),
    format_type: sc.formatType ?? "",
    format_time: sc.formatTime ?? offer.daySchedule ?? "",
    format_note: sc.formatNote ?? "",
    is_archived: boolCell(sc.isArchived),
    allow_waitlist_when_sold_out: boolCell(sc.allowWaitlistWhenSoldOut),
  };
  return HOT_HEADERS.map((h) => row[h] ?? "");
}

function buildHotRows() {
  const snapshot = readJson("data/offers-snapshot.json");
  const venueBySlug = buildVenueIndex();
  const rows = [];
  for (const [questSlug, offers] of Object.entries(snapshot.offersByQuest ?? {})) {
    for (const offer of offers) {
      const slug = questSlug || questSlugFromOfferId(offer.id);
      rows.push(offerToRow(offer, slug, venueBySlug));
    }
  }
  return rows;
}

function worldToRow(w) {
  return [
    w.slug ?? "",
    w.name ?? "",
    w.description ?? "",
    w.themeKey ?? "",
    w.tagline ?? "",
    typeof w.pitch === "string" ? w.pitch.trim() : "",
    joinList(w.highlights),
    w.heroVideoUrl ?? "",
    w.heroImageUrl ?? "",
    w.presentation?.cardGradient ?? "",
    w.presentation?.cardGlow ?? "",
    w.presentation?.iconKey ?? "",
  ];
}

function venueToRow(v) {
  return [
    v.slug ?? "",
    v.name ?? "",
    v.displayName ?? v.name ?? "",
    v.type ?? "",
    v.address ?? "",
    v.metro ?? "",
    v.city ?? "",
    v.district ?? "",
    v.latitude === undefined ? "" : String(v.latitude),
    v.longitude === undefined ? "" : String(v.longitude),
    v.schoolScopeSlug ?? "",
    boolCell(v.listedOnSites),
    v.logoUrl ?? "",
    joinLines(v.directions),
    v.entranceNote ?? "",
    v.contactNote ?? "",
  ];
}

function questToRow(q) {
  return [
    q.slug ?? "",
    q.worldSlug ?? "",
    q.title ?? "",
    q.tagline ?? "",
    q.catalogTagline ?? "",
    q.ageLabel ?? "",
    q.format ?? "",
    joinList(q.skills),
    boolCell(q.activeInCampaign ?? true),
    q.heroImageUrl ?? "",
    q.heroVideoUrl ?? "",
    q.groupSize ?? "",
    q.durationLabel ?? "",
    q.priceHint ?? "",
    typeof q.story === "string" ? q.story.trim() : "",
    typeof q.skillsParent === "string" ? q.skillsParent.trim() : "",
    typeof q.loot === "string" ? q.loot.trim() : "",
    typeof q.approach === "string" ? q.approach.trim() : "",
  ];
}

function buildColdRows() {
  return {
    Миры: loadYamlDir("worlds").map(worldToRow),
    Площадки: loadYamlDir("venues").map(venueToRow),
    Курсы: loadYamlDir("quests").map(questToRow),
  };
}

async function clearAndWrite(spreadsheetId, sheetTitle, headers, dataRows, token) {
  const lastCol = columnLetter(headers.length);
  const clearRange = `'${sheetTitle}'!A2:${lastCol}`;
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(clearRange)}:clear`;
  const clearRes = await fetch(clearUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!clearRes.ok) {
    throw new Error(`clear ${sheetTitle} ${clearRes.status}: ${await clearRes.text()}`);
  }

  if (dataRows.length === 0) {
    console.log(`[import] ${sheetTitle}: 0 data rows`);
    return;
  }

  const values = dataRows;
  const range = `'${sheetTitle}'!A2:${lastCol}${1 + dataRows.length}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    throw new Error(`write ${sheetTitle} ${res.status}: ${await res.text()}`);
  }
  console.log(`[import] ${sheetTitle}: ${dataRows.length} rows`);
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

async function writeHeadersIfNeeded(spreadsheetId, range, headers, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [headers] }),
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const hotOnly = args.has("--hot-only");
  const coldOnly = args.has("--cold-only");
  const doHot = !coldOnly;
  const doCold = !hotOnly;

  const token = await getAuthToken();

  if (doHot) {
    await writeHeadersIfNeeded(HOT_ID, "'Расписание'!A1", HOT_HEADERS, token);
    const rows = buildHotRows();
    await clearAndWrite(HOT_ID, "Расписание", HOT_HEADERS, rows, token);
  }

  if (doCold) {
    const cold = buildColdRows();
    for (const [title, rows] of Object.entries(cold)) {
      const headers =
        title === "Миры"
          ? [
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
            ]
          : title === "Площадки"
            ? [
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
              ]
            : [
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
              ];
      await writeHeadersIfNeeded(COLD_ID, `'${title}'!A1`, headers, token);
      await clearAndWrite(COLD_ID, title, headers, rows, token);
    }
  }

  console.log("[import] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
