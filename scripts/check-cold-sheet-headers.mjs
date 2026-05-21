#!/usr/bin/env node
/**
 * Compare Cold spreadsheet header rows to cold-sheet-contract + seed.
 * Usage: node scripts/check-cold-sheet-headers.mjs [gid]
 */
import { GoogleAuth } from "google-auth-library";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(`${ROOT}/scripts/sheets.env`);

const COLD_ID =
  process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() ||
  "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc";

const TARGET_GID = process.argv[2]?.trim() || "1739937073";

const EXPECTED = {
  Миры: [
    "slug", "name", "description", "theme_key", "tagline", "pitch", "highlights",
    "hero_video_embed_url", "card_gradient", "card_glow", "icon_key",
  ],
  Площадки: [
    "slug", "name", "display_name", "type", "address", "metro", "city", "district",
    "latitude", "longitude", "school_scope_slug", "listed_on_sites",
    "directions", "entrance_note", "contact_note",
  ],
  Курсы: [
    "slug", "world_slug", "title", "tagline", "catalog_tagline", "age_label", "format",
    "skills", "active_in_campaign", "hero_video_embed_url", "group_size",
    "duration_label", "price_hint", "story", "skills_parent", "loot", "approach",
  ],
};

const REQUIRED = {
  Миры: [
    "slug", "name", "description", "theme_key", "tagline", "pitch", "highlights",
  ],
  Площадки: [
    "slug", "name", "display_name", "type", "address", "metro", "city", "district",
    "latitude", "longitude", "school_scope_slug", "listed_on_sites",
    "directions", "entrance_note", "contact_note",
  ],
  Курсы: [
    "slug", "world_slug", "title", "tagline", "age_label", "format", "skills",
    "story", "skills_parent", "loot", "approach",
  ],
};

function norm(h) {
  return String(h)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function compare(sheetName, headers) {
  const normalized = headers.map(norm).filter(Boolean);
  const req = REQUIRED[sheetName] || [];
  const exp = EXPECTED[sheetName] || [];
  const missingReq = req.filter((r) => !normalized.includes(r));
  const missingSeed = exp.filter((r) => !normalized.includes(r));
  const extra = normalized.filter((h) => !exp.includes(h));
  const legacy = ["logo_url", "hero_image_url", "hero_video_url", "photos_urls"];
  const foundLegacy = legacy.filter((l) => normalized.includes(l));
  return { normalized, missingReq, missingSeed, extra, foundLegacy };
}

async function getToken() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing");
  const auth = new GoogleAuth({
    credentials: JSON.parse(json),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
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

async function main() {
  const token = await getToken();
  const meta = await sheetsGet(
    `https://sheets.googleapis.com/v4/spreadsheets/${COLD_ID}?fields=sheets.properties`,
    token,
  );

  console.log(`Spreadsheet: ${COLD_ID}\n`);
  let targetTab = null;
  for (const s of meta.sheets ?? []) {
    const title = s.properties?.title ?? "?";
    const gid = String(s.properties?.sheetId ?? "");
    const marker = gid === TARGET_GID ? " <-- URL gid" : "";
    console.log(`  [${gid}] ${title}${marker}`);
    if (gid === TARGET_GID) targetTab = title;
  }
  console.log("");
  if (targetTab) {
    console.log(`URL gid ${TARGET_GID} = лист «${targetTab}»\n`);
  }

  let allOk = true;
  for (const sheetName of Object.keys(EXPECTED)) {
    const range = encodeURIComponent(`'${sheetName}'!1:1`);
    const data = await sheetsGet(
      `https://sheets.googleapis.com/v4/spreadsheets/${COLD_ID}/values/${range}`,
      token,
    );
    const row = data.values?.[0] ?? [];
    const c = compare(sheetName, row);
    console.log(`=== ${sheetName} ===`);
    console.log(`Headers: ${c.normalized.join(", ") || "(empty)"}`);
    if (c.missingReq.length) {
      console.log(`FAIL required: ${c.missingReq.join(", ")}`);
      allOk = false;
    } else {
      console.log("OK required (sync will pass header check)");
    }
    if (c.missingSeed.length) {
      console.log(`Note — optional/seed columns missing: ${c.missingSeed.join(", ")}`);
    }
    if (c.foundLegacy.length) {
      console.log(`Legacy (ignored): ${c.foundLegacy.join(", ")}`);
    }
    if (c.extra.length) {
      console.log(`Extra: ${c.extra.join(", ")}`);
    }
    if (targetTab === sheetName) {
      console.log("(this is the tab from your URL)");
    }
    console.log("");
  }

  if (targetTab && !EXPECTED[targetTab]) {
    console.log(`WARN: gid points to «${targetTab}», not a standard cold tab.`);
  }

  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
