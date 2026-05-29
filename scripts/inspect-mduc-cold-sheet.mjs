#!/usr/bin/env node
/**
 * Compare MDUC EKT venue rows in Cold Google Sheet vs local map-snapshot.json
 * Usage: node scripts/inspect-mduc-cold-sheet.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { GoogleAuth } from "google-auth-library";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

const COLD_ID =
  process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() ||
  "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc";

const FIELDS = [
  "slug",
  "display_name",
  "district",
  "metro",
  "school_scope_slug",
  "address",
];

function normalizeHeader(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
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

async function fetchGrid(range, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(COLD_ID)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.values ?? [];
}

function pickRow(headers, row) {
  const idx = (name) => headers.map(normalizeHeader).indexOf(name);
  return Object.fromEntries(FIELDS.map((field) => [field, row[idx(field)] ?? ""]));
}

function loadLocalMduc() {
  const snapPath = path.join(ROOT, "apps", "web", "data", "v2", "map-snapshot.json");
  const snap = JSON.parse(fs.readFileSync(snapPath, "utf8"));
  return (snap.venues ?? []).filter((venue) => String(venue.slug).includes("mduc-ekt"));
}

async function main() {
  const token = await getToken();
  const grid = await fetchGrid("'Площадки'!A1:O", token);
  const headers = grid[0] ?? [];

  console.log(`Cold spreadsheet: ${COLD_ID}\n`);
  console.log("=== Google Sheet: Площадки (mduc-ekt*) ===");
  const sheetRows = [];
  for (let i = 1; i < grid.length; i++) {
    const row = grid[i];
    const picked = pickRow(headers, row);
    if (!String(picked.slug).includes("mduc-ekt")) continue;
    sheetRows.push(picked);
    console.log(JSON.stringify(picked, null, 2));
  }
  if (sheetRows.length === 0) console.log("(no rows found)");

  console.log("\n=== Local map-snapshot.json ===");
  const localRows = loadLocalMduc();
  for (const venue of localRows) {
    console.log(
      JSON.stringify(
        {
          slug: venue.slug,
          display_name: venue.displayName ?? "",
          district: venue.district ?? "",
          metro: venue.metro ?? "",
          school_scope_slug: venue.schoolScopeSlug ?? "",
          address: venue.address ?? "",
        },
        null,
        2,
      ),
    );
  }

  console.log("\n=== Diff (sheet vs local) ===");
  for (const local of localRows) {
    const sheet = sheetRows.find((row) => row.slug === local.slug);
    if (!sheet) {
      console.log(`${local.slug}: MISSING in sheet`);
      continue;
    }
    const mismatches = [];
    if ((sheet.district || "") !== (local.district || "")) {
      mismatches.push(`district: sheet="${sheet.district}" local="${local.district}"`);
    }
    if ((sheet.school_scope_slug || "") !== (local.schoolScopeSlug || "")) {
      mismatches.push(
        `school_scope_slug: sheet="${sheet.school_scope_slug}" local="${local.schoolScopeSlug}"`,
      );
    }
    if ((sheet.display_name || "") !== (local.displayName || "")) {
      mismatches.push(
        `display_name: sheet="${sheet.display_name}" local="${local.displayName}"`,
      );
    }
    if (mismatches.length === 0) {
      console.log(`${local.slug}: OK`);
    } else {
      console.log(`${local.slug}: MISMATCH — ${mismatches.join("; ")}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
