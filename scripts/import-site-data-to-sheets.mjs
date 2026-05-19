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

function splitProgramName(full) {
  const s = String(full || "").trim();
  const idx = s.indexOf(":");
  if (idx === -1) return { program_name_h1: "", program_name_h2: s };
  return {
    program_name_h1: s.slice(0, idx).trim(),
    program_name_h2: s.slice(idx + 1).trim(),
  };
}

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

const HOT_ID =
  process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
  "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";
const COLD_ID =
  process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() ||
  "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc";

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
  "enrolled",
  "mos_ru_code",
  "mos_ru_link",
  "age_group",
  "registration_channel",
  "allow_preliminary_registration",
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
  let s = String(label).trim().replace(/^'+/, "");
  const usDecimal = s.match(/^([\d\s'’]+)\.(\d{1,2})$/);
  if (usDecimal) {
    return usDecimal[1].replace(/[^\d]/g, "") || "";
  }
  const comma = s.match(/^(.+),(\d{1,2})$/);
  if (comma) {
    return comma[1].replace(/[^\d]/g, "") || "";
  }
  return s.replace(/[^\d]/g, "") || "";
}

function shiftGroupIdFromOffer(offer, questSlug) {
  if (offer.id?.startsWith("sheet:")) return offer.id.slice("sheet:".length);
  return `${questSlug}:${offer.venueSlug}:${offer.startDate}:${offer.endDate}`;
}

function parseTimesFromVariantTime(timeStr, fallbackStart, fallbackEnd) {
  const m = String(timeStr || "").match(
    /(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/,
  );
  if (m) return { start: m[1], end: m[2] };
  return { start: fallbackStart, end: fallbackEnd };
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

function offerToGroupRow(offer, questSlug, venueBySlug) {
  const sc = offer.scheduleCard ?? {};
  const venue = venueBySlug.get(offer.venueSlug) ?? {};
  const parts = (offer.shiftLabel ?? "").split(" · ");
  const schoolName = parts.length > 1 ? parts[parts.length - 1].trim() : "";
  const programSource =
    sc.programFilterLabel ??
    (sc.programNameH1 || sc.programNameH2
      ? [sc.programNameH1, sc.programNameH2].filter(Boolean).join(": ")
      : "") ??
    parts[0]?.trim() ??
    "";
  const { program_name_h1, program_name_h2 } = splitProgramName(programSource);
  const row = {
    shift_group_id: shiftGroupIdFromOffer(offer, questSlug),
    program_name_h1,
    program_name_h2,
    quest_slug: questSlug,
    venue_slug: offer.venueSlug ?? "",
    start_date: offer.startDate ?? "",
    end_date: offer.endDate ?? "",
    school_name: schoolName,
    address: venue.address ?? "",
    status: offer.sheetStatus ?? sc.status ?? "",
    metro_station: venue.metro ?? "",
    teacher: sc.teacherName ?? "",
    max_capacity:
      offer.maxCapacity === undefined ? "" : String(offer.maxCapacity),
    notes: stripIncludedParts(offer.includedNote),
    description: sc.description ?? "",
    tags: (sc.tags ?? []).join("; "),
    is_archived: boolCell(sc.isArchived),
    allow_waitlist_when_sold_out: boolCell(sc.allowWaitlistWhenSoldOut),
  };
  return HOT_GROUP_HEADERS.map((h) => row[h] ?? "");
}

function offerToFormatRow(offer, questSlug, variant) {
  const sc = offer.scheduleCard ?? {};
  const formatType = variant?.type ?? sc.formatType ?? "";
  const formatNote = variant?.note ?? sc.formatNote ?? "";
  const priceSource = variant?.priceLabel ?? offer.priceLabel;
  const times = parseTimesFromVariantTime(
    variant?.time,
    offer.startTime ?? "",
    offer.endTime ?? "",
  );
  const row = {
    shift_group_id: shiftGroupIdFromOffer(offer, questSlug),
    start_time: times.start,
    end_time: times.end,
    price: parsePriceLabel(priceSource),
    format_type: formatType,
    format_note: formatNote,
    enrolled:
      variant?.enrolled === undefined ? "" : String(variant.enrolled),
    mos_ru_code: variant?.mosRuCode ?? sc.mosRuCode ?? "",
    mos_ru_link: variant?.mosBookingUrl ?? offer.mosBookingUrl ?? "",
    age_group: variant?.ageLabel ?? sc.ageLabel ?? "",
    registration_channel:
      variant?.registrationChannel ?? sc.registrationChannel ?? "",
    allow_preliminary_registration: boolCell(
      variant?.allowPreliminaryRegistration ?? sc.allowPreliminaryRegistration,
    ),
  };
  return HOT_FORMAT_HEADERS.map((h) => row[h] ?? "");
}

function buildHotSheets() {
  const snapshot = readJson("data/offers-snapshot.json");
  const venueBySlug = buildVenueIndex();
  const groupById = new Map();
  const formatRows = [];
  for (const [questSlug, offers] of Object.entries(snapshot.offersByQuest ?? {})) {
    for (const offer of offers) {
      const slug = questSlug || questSlugFromOfferId(offer.id);
      const groupId = shiftGroupIdFromOffer(offer, slug);
      if (!groupById.has(groupId)) {
        groupById.set(groupId, offerToGroupRow(offer, slug, venueBySlug));
      }
      const variants = offer.scheduleCard?.variants?.length
        ? offer.scheduleCard.variants
        : [null];
      for (const variant of variants) {
        formatRows.push({
          groupId,
          row: offerToFormatRow(offer, slug, variant),
        });
      }
    }
  }
  const groups = [...groupById.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ru"))
    .map(([, row]) => row);
  formatRows.sort((a, b) => a.groupId.localeCompare(b.groupId, "ru"));
  return { groups, formats: formatRows.map((e) => e.row) };
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
    await writeHeadersIfNeeded(HOT_ID, "'Группы'!A1", HOT_GROUP_HEADERS, token);
    await writeHeadersIfNeeded(HOT_ID, "'Форматы'!A1", HOT_FORMAT_HEADERS, token);
    const { groups, formats } = buildHotSheets();
    await clearAndWrite(HOT_ID, "Группы", HOT_GROUP_HEADERS, groups, token);
    await clearAndWrite(HOT_ID, "Форматы", HOT_FORMAT_HEADERS, formats, token);
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
