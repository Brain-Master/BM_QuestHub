#!/usr/bin/env node
/**
 * Export apps/web/content/*.yaml → data/v2 catalog, map, and detail JSON snapshots.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "apps", "web");
const CONTENT = path.join(WEB, "content");
const DATA_V2 = path.join(WEB, "data", "v2");
const DETAIL_DIR = path.join(DATA_V2, "detail");

const SOURCE = "export-yaml-to-snapshots";
const GENERATED_AT = new Date().toISOString();

function sha256Json(value) {
  const raw = JSON.stringify(value);
  return `sha256:${crypto.createHash("sha256").update(raw, "utf8").digest("hex")}`;
}

function readYamlDir(dirName) {
  const dir = path.join(CONTENT, dirName);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith(".yaml") || n.endsWith(".yml"))
    .map((name) => {
      const filePath = path.join(dir, name);
      const data = parseYaml(fs.readFileSync(filePath, "utf8"));
      return { filePath, data };
    });
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`[export-yaml] wrote ${path.relative(ROOT, filePath)}`);
}

function stripOffers(quest) {
  const { offers: _offers, ...rest } = quest;
  return rest;
}

function main() {
  const worlds = readYamlDir("worlds").map(({ data }) => data);
  const courses = readYamlDir("quests").map(({ data }) => stripOffers(data));
  const venues = readYamlDir("venues").map(({ data }) => data);

  const catalogBody = { worlds, courses };
  const mapBody = { venues };

  const catalogSnapshot = {
    version: 2,
    generatedAt: GENERATED_AT,
    source: SOURCE,
    integrity: { contentHash: sha256Json(catalogBody) },
    ...catalogBody,
  };

  const mapSnapshot = {
    version: 2,
    generatedAt: GENERATED_AT,
    source: SOURCE,
    integrity: { contentHash: sha256Json(mapBody) },
    ...mapBody,
  };

  writeJson(path.join(DATA_V2, "catalog-snapshot.json"), catalogSnapshot);
  writeJson(path.join(DATA_V2, "map-snapshot.json"), mapSnapshot);

  fs.mkdirSync(DETAIL_DIR, { recursive: true });
  for (const course of courses) {
    const detailSnapshot = {
      version: 2,
      generatedAt: GENERATED_AT,
      source: SOURCE,
      integrity: { contentHash: sha256Json({ course }) },
      course,
    };
    writeJson(path.join(DETAIL_DIR, `${course.slug}.json`), detailSnapshot);
  }

  const manifestPath = path.join(DATA_V2, "site-manifest.json");
  let manifest = {
    version: 2,
    generatedAt: GENERATED_AT,
    source: SOURCE,
    snapshots: {},
  };
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.generatedAt = GENERATED_AT;
    manifest.source = SOURCE;
  }

  manifest.snapshots = {
    ...manifest.snapshots,
    site: manifest.snapshots?.site ?? { path: "data/v2/site-config.json" },
    catalog: {
      path: "data/v2/catalog-snapshot.json",
      contentHash: catalogSnapshot.integrity.contentHash,
    },
    map: {
      path: "data/v2/map-snapshot.json",
      contentHash: mapSnapshot.integrity.contentHash,
    },
    schedule: manifest.snapshots?.schedule ?? {
      path: "data/offers-snapshot.json",
    },
  };

  writeJson(manifestPath, manifest);
  console.log(
    `[export-yaml] done: ${worlds.length} worlds, ${courses.length} courses, ${venues.length} venues`,
  );
}

main();
