#!/usr/bin/env node
/**
 * Render placeholder WebP files with safe-area markup.
 * Usage: node scripts/generate-media-placeholders.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "apps/web/package.json"));
const sharp = require("sharp");
const OUT_DIR = path.join(ROOT, "apps", "web", "media", "placeholders");

function frameSvg(width, height, label) {
  const safeW = Math.round(width * 0.55);
  const safeH = Math.round(height * 0.55);
  const safeX = Math.round((width - safeW) / 2);
  const safeY = Math.round((height - safeH) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#111827"/>
  <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#ffffff" stroke-width="4"/>
  <rect x="${safeX}" y="${safeY}" width="${safeW}" height="${safeH}" fill="none" stroke="#22d3ee" stroke-width="4" stroke-dasharray="16 12"/>
  <text x="24" y="48" fill="#e2e8f0" font-family="Arial,sans-serif" font-size="28" font-weight="700">${label}</text>
</svg>`;
}

/** Compact schedule: horizontal zones at 1600x900 */
const COMPACT_SVG = frameSvg(1600, 900, "compact 4:3")
  .replace(
    '<rect width="1600" height="900" fill="#111827"/>',
    `<rect width="1600" height="900" fill="#111827"/>
  <rect x="900" y="0" width="700" height="900" fill="#000000" opacity="0.4"/>
  <rect x="0" y="0" width="1600" height="120" fill="#ef4444" opacity="0.25"/>`,
  );

const SLOT_SOURCES = [
  { out: "quest-hero-16x9.placeholder.webp", svg: frameSvg(1920, 1080, "quest hero 16:9"), width: 1920 },
  { out: "quest-catalog-4x3.placeholder.webp", svg: frameSvg(1600, 1200, "quest catalog 4:3"), width: 1600 },
  { out: "world-hero-16x9.placeholder.webp", svg: frameSvg(1920, 1080, "world hero 16:9"), width: 1920 },
  { out: "schedule-hero-16x9.placeholder.webp", svg: frameSvg(1600, 900, "schedule hero 16:9"), width: 1600 },
  { out: "schedule-compact-4x3.placeholder.webp", svg: COMPACT_SVG, width: 1600 },
  { out: "venue-logo-256.placeholder.webp", svg: frameSvg(512, 512, "venue logo 1:1"), width: 512 },
  { out: "venue-photo-16x10.placeholder.webp", svg: frameSvg(1280, 800, "venue photo 16:10"), width: 1280 },
  { out: "og-1200x630.placeholder.webp", svg: frameSvg(1200, 630, "og 1200x630"), width: 1200 },
];

async function renderPlaceholder({ out, svg, width }) {
  const dest = path.join(OUT_DIR, out);
  const buf = await sharp(Buffer.from(svg)).resize({ width, withoutEnlargement: false }).webp({ quality: 78 }).toBuffer();
  fs.writeFileSync(dest, buf);
  console.log(`[placeholders] ${path.relative(ROOT, dest)} (${buf.length} bytes)`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const slot of SLOT_SOURCES) {
    await renderPlaceholder(slot);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
