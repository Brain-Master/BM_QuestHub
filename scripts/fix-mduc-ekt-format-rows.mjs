#!/usr/bin/env node
/**
 * Fix MDUC EKT format rows: column order was registration_channel before enrolled,
 * but sheet headers use enrolled before mos_ru_code (see sheet-hot-join.ts).
 */
import path from "node:path";

import { GoogleAuth } from "google-auth-library";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));

const HOT_ID =
  process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
  "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";

const FORMAT_NOTE =
  "Электроника и расходники включены. Камерный формат: до 12 человек.";

const FIXES = [
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
];

/** Matches HOT_FORMAT_FIELD_KEYS / actual sheet header order. */
function formatRow(f) {
  return [
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
  ];
}

function normalizeHeader(raw) {
  return String(raw)
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

async function main() {
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const token = (await auth.getClient().then((c) => c.getAccessToken())).token;

  const range = "'Форматы'!A1:AZ";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(HOT_ID)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const grid = (await res.json()).values ?? [];
  const headers = grid[0].map(normalizeHeader);
  const idCol = headers.indexOf("shift_group_id");
  if (idCol === -1) throw new Error("shift_group_id column not found");

  console.log("[fix-mduc-ekt] headers:", headers.filter(Boolean).join(", "));

  const updates = [];
  for (let i = 1; i < grid.length; i++) {
    const rowId = String(grid[i][idCol] ?? "").trim();
    const fix = FIXES.find((f) => f.id === rowId);
    if (!fix) continue;
    const rowNum = i + 1;
    const lastCol = columnLetter(formatRow(fix).length);
    updates.push({
      range: `'Форматы'!A${rowNum}:${lastCol}${rowNum}`,
      values: [formatRow(fix)],
    });
    console.log(`[fix-mduc-ekt] will update row ${rowNum}: ${rowId}`);
  }

  if (updates.length === 0) {
    console.log("[fix-mduc-ekt] no rows found");
    return;
  }

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(HOT_ID)}/values:batchUpdate`;
  const batchRes = await fetch(batchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: updates,
    }),
  });
  if (!batchRes.ok) throw new Error(await batchRes.text());
  console.log(`[fix-mduc-ekt] updated ${updates.length} row(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
