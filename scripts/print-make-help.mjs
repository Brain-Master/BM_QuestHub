#!/usr/bin/env node
/**
 * Parses BM_QuestHub/Makefile help annotations:
 *   ## @Section title
 *   target: [deps] ## target-name  Description
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const makefile = readFileSync(join(root, "Makefile"), "utf8");

console.log("Quest Hub — make help");
console.log("  Корень: BM_QuestHub/Makefile   Из apps/web: make <цель>  (проброс в корень)");
console.log("  Параметры: make encode-hero-video SLUG=... SOURCE=...");
console.log();

for (const line of makefile.split(/\r?\n/)) {
  if (line.startsWith("## @")) {
    console.log();
    console.log(line.slice(4).trim());
    continue;
  }
  const m = line.match(/^([a-zA-Z0-9_.-]+):.*## (.+)$/);
  if (!m || m[1] === "help") continue;
  let desc = m[2].trim();
  desc = desc.replace(/^[a-zA-Z0-9_.-]+\s+/, "");
  console.log(`  ${m[1].padEnd(28)} ${desc}`);
}
