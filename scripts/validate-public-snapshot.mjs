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

function hasNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateColdMediaPresence() {
  const catalogPath = path.join(WEB, "data", "v2", "catalog-snapshot.json");
  const mapPath = path.join(WEB, "data", "v2", "map-snapshot.json");
  if (!fs.existsSync(catalogPath) || !fs.existsSync(mapPath)) {
    console.warn("[validate-public-snapshot] skip media-url guard (missing cold snapshots)");
    return [];
  }

  const errors = [];
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));

  const worlds = Array.isArray(catalog.worlds) ? catalog.worlds : [];
  const courses = Array.isArray(catalog.courses) ? catalog.courses : [];
  const venues = Array.isArray(map.venues) ? map.venues : [];

  const worldWithoutHero = worlds.filter(
    (w) => hasNonEmptyString(w?.slug) && !hasNonEmptyString(w?.heroImageUrl),
  );
  if (worldWithoutHero.length > 0) {
    errors.push(
      `worlds without heroImageUrl: ${worldWithoutHero
        .slice(0, 5)
        .map((w) => w.slug)
        .join(", ")}`,
    );
  }

  const coursesWithoutImages = courses.filter(
    (c) =>
      hasNonEmptyString(c?.slug) &&
      (!hasNonEmptyString(c?.heroImageUrl) || !hasNonEmptyString(c?.catalogImageUrl)),
  );
  if (coursesWithoutImages.length > 0) {
    errors.push(
      `courses without hero/catalog image URLs: ${coursesWithoutImages
        .slice(0, 5)
        .map((c) => c.slug)
        .join(", ")}`,
    );
  }

  const venuesWithoutMedia = venues.filter((v) => {
    if (!hasNonEmptyString(v?.slug)) return false;
    const hasLogo = hasNonEmptyString(v?.logoUrl);
    const hasPhotos = Array.isArray(v?.photos) && v.photos.length > 0;
    return !hasLogo && !hasPhotos;
  });
  if (venuesWithoutMedia.length > 0) {
    errors.push(
      `venues without logoUrl/photos: ${venuesWithoutMedia
        .slice(0, 5)
        .map((v) => v.slug)
        .join(", ")}`,
    );
  }

  return errors;
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

const coldMediaErrors = validateColdMediaPresence();
if (coldMediaErrors.length > 0) {
  failed = true;
  console.error(
    `[validate-public-snapshot] media-url guard failed: ${coldMediaErrors.join(" | ")}`,
  );
} else {
  console.log("[validate-public-snapshot] media-url guard ok");
}

if (failed) process.exit(1);
