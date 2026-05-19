#!/usr/bin/env node
/**
 * CI guard: public JSON must not contain denylisted private keys.
 * Keep PRIVATE_KEYS in sync with apps/web/lib/data/v2/private-field-denylist.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "apps", "web");

const PRIVATE_KEYS = [
  "manageremail",
  "managerphone",
  "internalnote",
  "draft",
  "crmsecret",
  "apikey",
  "password",
  "serviceaccount",
  "privatekey",
  "sheetrowid",
];

function collectPublicFiles() {
  const files = [
    path.join(WEB, "data", "v2", "site-config.json"),
    path.join(WEB, "data", "v2", "site-manifest.json"),
    path.join(WEB, "data", "v2", "catalog-snapshot.json"),
    path.join(WEB, "data", "v2", "map-snapshot.json"),
    path.join(WEB, "data", "offers-snapshot.json"),
  ];
  const detailDir = path.join(WEB, "data", "v2", "detail");
  if (fs.existsSync(detailDir)) {
    for (const name of fs.readdirSync(detailDir)) {
      if (name.endsWith(".json")) files.push(path.join(detailDir, name));
    }
  }
  return files;
}

function findViolations(value, currentPath = "") {
  const violations = [];
  if (value === null || typeof value !== "object") return violations;

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);

  for (const [key, nested] of entries) {
    const nextPath = currentPath ? `${currentPath}.${key}` : key;
    const normalized = key.toLowerCase();
    if (PRIVATE_KEYS.some((denied) => normalized.includes(denied))) {
      violations.push(nextPath);
    }
    violations.push(...findViolations(nested, nextPath));
  }
  return violations;
}

let failed = false;

for (const file of collectPublicFiles()) {
  if (!fs.existsSync(file)) {
    console.warn(`[validate-public-snapshot] skip missing ${path.relative(ROOT, file)}`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const violations = findViolations(data);
  if (violations.length > 0) {
    failed = true;
    console.error(
      `[validate-public-snapshot] ${path.relative(ROOT, file)}: denylisted keys at ${violations.slice(0, 5).join(", ")}`,
    );
  } else {
    console.log(`[validate-public-snapshot] ok ${path.relative(ROOT, file)}`);
  }
}

if (failed) process.exit(1);
