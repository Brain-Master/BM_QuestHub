#!/usr/bin/env node
/**
 * PSD templates with safe-area guides (from media/placeholders WebP).
 * Usage: node scripts/generate-design-pack-psd.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { writePsdBuffer } from "ag-psd";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "apps/web/package.json"));
const sharp = require("sharp");

const PLACEHOLDERS = path.join(ROOT, "apps", "web", "media", "placeholders");
const OUT_DIR = path.join(ROOT, "docs", "design", "pack", "psd");

const TEMPLATES = [
  { out: "quest-hero-16x9.psd", src: "quest-hero-16x9.placeholder.webp" },
  { out: "quest-catalog-4x3.psd", src: "quest-catalog-4x3.placeholder.webp" },
  { out: "world-hero-16x9.psd", src: "world-hero-16x9.placeholder.webp" },
  { out: "schedule-hero-16x9.psd", src: "schedule-hero-16x9.placeholder.webp" },
  { out: "schedule-compact-4x3.psd", src: "schedule-compact-4x3.placeholder.webp" },
  { out: "venue-logo-256.psd", src: "venue-logo-256.placeholder.webp" },
  { out: "venue-photo-16x10.psd", src: "venue-photo-16x10.placeholder.webp" },
  { out: "og-1200x630.psd", src: "og-1200x630.placeholder.webp" },
];

async function loadRgbaFromWebp(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  return {
    width: info.width,
    height: info.height,
    data: new Uint8ClampedArray(data),
  };
}

async function writePsdTemplate({ out, src }) {
  const filePath = path.join(PLACEHOLDERS, src);
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing ${filePath} — run: make media-placeholders`);
  }
  const imageData = await loadRgbaFromWebp(filePath);
  const psd = {
    width: imageData.width,
    height: imageData.height,
    children: [
      {
        name: "SAFE_AREA_GUIDE",
        top: 0,
        left: 0,
        bottom: imageData.height,
        right: imageData.width,
        imageData,
      },
    ],
  };
  fs.writeFileSync(path.join(OUT_DIR, out), writePsdBuffer(psd));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const t of TEMPLATES) {
    await writePsdTemplate(t);
    console.log(`[design-pack-psd] ${t.out}`);
  }
  fs.writeFileSync(
    path.join(OUT_DIR, "README.txt"),
    [
      "PSD templates — layer SAFE_AREA_GUIDE (safe / gradient / hidden zones).",
      "Place your artwork above, export as .source.jpg / .source.png per 02_Структура_inbox.pdf.",
      "",
      ...TEMPLATES.map((t) => t.out),
    ].join("\n"),
    "utf8",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
