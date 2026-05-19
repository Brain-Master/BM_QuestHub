#!/usr/bin/env node
/**
 * Fails CI if legacy product-data constants reappear in production lib/.
 * Patterns must stay in sync with docs/data/data-inventory-v2.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIB = path.join(ROOT, "apps", "web", "lib");

const FORBIDDEN = [
  { id: "SCHOOL_TO_VENUE", pattern: /SCHOOL_TO_VENUE/ },
  { id: "FRAGMENTS_quest_slug", pattern: /const\s+FRAGMENTS\s*:\s*\{/ },
  { id: "SITE_MAP_POINTS_export", pattern: /export const SITE_MAP_POINTS\s*=\s*\{/ },
  { id: "MAP_GEO_CONTROL_POINTS_export", pattern: /export const MAP_GEO_CONTROL_POINTS\s*=\s*\[/ },
  { id: "WORLD_NAV_GROUPS", pattern: /WORLD_NAV_GROUPS/ },
  { id: "CITY_META_hardcoded", pattern: /export const CITY_META[^=]*=\s*\{\s*moscow:/ },
];

const ALLOWLIST = new Set([
  path.join(LIB, "sites", "map-calibration.ts"),
  path.join(LIB, "sites", "map-config.ts"),
  path.join(LIB, "offers", "schedule-dictionaries.ts"),
]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === "dev") continue;
      walk(full, files);
    } else if (name.name.endsWith(".ts") && !name.name.endsWith(".test.ts")) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];

for (const file of walk(LIB)) {
  if (ALLOWLIST.has(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const rule of FORBIDDEN) {
    if (rule.pattern.test(text)) {
      violations.push({ file: path.relative(ROOT, file), rule: rule.id });
    }
  }
}

if (violations.length > 0) {
  console.error("[audit-hardcoded-data] forbidden patterns found:");
  for (const v of violations) {
    console.error(`  ${v.rule} in ${v.file}`);
  }
  process.exit(1);
}

console.log("[audit-hardcoded-data] ok — no forbidden legacy patterns in lib/");
