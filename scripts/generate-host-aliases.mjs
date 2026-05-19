#!/usr/bin/env node
/**
 * Build apps/web/public/host-aliases.json from content/venues YAML.
 *
 *   node scripts/generate-host-aliases.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { buildHostAliasesDocument } from "./host-alias-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VENUES_DIR = path.join(ROOT, "apps", "web", "content", "venues");
const OUT = path.join(ROOT, "apps", "web", "public", "host-aliases.json");

function loadVenues() {
  const names = fs.readdirSync(VENUES_DIR).filter(
    (n) => n.endsWith(".yaml") || n.endsWith(".yml"),
  );
  const venues = [];
  for (const name of names) {
    const raw = fs.readFileSync(path.join(VENUES_DIR, name), "utf8");
    const data = parseYaml(raw);
    if (data && typeof data.slug === "string") venues.push(data);
  }
  return venues;
}

function main() {
  const venues = loadVenues();
  const doc = buildHostAliasesDocument(venues);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  const count = Object.keys(doc.schools).length;
  console.log(`[generate-host-aliases] wrote ${OUT} (${count} school hosts)`);
}

main();
