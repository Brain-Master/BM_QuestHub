#!/usr/bin/env node
/**
 * Update MDUC EKT venue rows in Cold Google Sheet (district + school_scope_slug).
 * Usage: node scripts/update-mduc-ekt-cold-rows.mjs [--dry-run]
 */
import path from "node:path";

import { GoogleAuth } from "google-auth-library";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

const COLD_ID =
  process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() ||
  "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc";

const DRY_RUN = process.argv.includes("--dry-run");

const UPDATES = {
  "mduc-ekt-odesskaya": {
    district: "Зюзино",
    school_scope_slug: "mduc-ekt",
  },
  "mduc-ekt-mosfilmovskaya": {
    school_scope_slug: "mduc-ekt",
  },
};

function normalizeHeader(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function columnLetter(index) {
  let letter = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
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

async function fetchGrid(token) {
  const range = encodeURIComponent("'Площадки'!A1:O");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(COLD_ID)}/values/${range}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.values ?? [];
}

async function batchUpdate(data, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(COLD_ID)}/values:batchUpdate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      valueInputOption: "RAW",
      data,
    }),
  });
  if (!res.ok) throw new Error(`batchUpdate ${res.status}: ${await res.text()}`);
}

async function main() {
  const token = await getToken();
  const grid = await fetchGrid(token);
  const headers = grid[0] ?? [];
  const headerNorm = headers.map(normalizeHeader);
  const slugIdx = headerNorm.indexOf("slug");
  const districtIdx = headerNorm.indexOf("district");
  const scopeIdx = headerNorm.indexOf("school_scope_slug");

  if (slugIdx === -1 || districtIdx === -1 || scopeIdx === -1) {
    throw new Error("Missing slug/district/school_scope_slug columns on Площадки");
  }

  const changes = [];

  for (let rowNum = 1; rowNum < grid.length; rowNum++) {
    const row = grid[rowNum];
    const slug = String(row[slugIdx] ?? "").trim();
    const patch = UPDATES[slug];
    if (!patch) continue;

    const sheetRow = rowNum + 1;
    if (patch.district !== undefined) {
      const current = String(row[districtIdx] ?? "").trim();
      if (current !== patch.district) {
        changes.push({
          range: `'Площадки'!${columnLetter(districtIdx)}${sheetRow}`,
          values: [[patch.district]],
          slug,
          field: "district",
          from: current,
          to: patch.district,
        });
      }
    }
    if (patch.school_scope_slug !== undefined) {
      const current = String(row[scopeIdx] ?? "").trim();
      if (current !== patch.school_scope_slug) {
        changes.push({
          range: `'Площадки'!${columnLetter(scopeIdx)}${sheetRow}`,
          values: [[patch.school_scope_slug]],
          slug,
          field: "school_scope_slug",
          from: current,
          to: patch.school_scope_slug,
        });
      }
    }
  }

  if (changes.length === 0) {
    console.log("[update-mduc-ekt-cold] nothing to update — sheet already matches");
    return;
  }

  for (const change of changes) {
    console.log(
      `[update-mduc-ekt-cold] ${change.slug}.${change.field}: "${change.from}" → "${change.to}" (${change.range})`,
    );
  }

  if (DRY_RUN) {
    console.log("[update-mduc-ekt-cold] dry-run — no writes");
    return;
  }

  await batchUpdate(
    changes.map(({ range, values }) => ({ range, values })),
    token,
  );
  console.log(`[update-mduc-ekt-cold] updated ${changes.length} cell(s)`);
}

main().catch((error) => {
  console.error("[update-mduc-ekt-cold] failed:", error.message);
  process.exit(1);
});
