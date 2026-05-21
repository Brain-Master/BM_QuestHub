#!/usr/bin/env node
/**
 * Scaffold media/inbox placeholders from current snapshots (no Sheet sync).
 * Usage: node scripts/media-scaffold.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function findTsx() {
  const candidates = [
    path.join(ROOT, "apps/web/node_modules/tsx/dist/cli.mjs"),
    path.join(ROOT, "node_modules/tsx/dist/cli.mjs"),
  ];
  return candidates.find((c) => fs.existsSync(c)) ?? null;
}

const tsx = findTsx();
if (!tsx) {
  console.error("[media-scaffold] install tsx in apps/web");
  process.exit(1);
}

const { spawnSync } = await import("node:child_process");
const script = `
import fs from "node:fs";
import path from "node:path";
import { buildMediaInboxContext } from "../apps/web/lib/media/ingest-media-inbox.ts";
import { ensureMediaInboxScaffold } from "../apps/web/lib/media/ensure-media-inbox-scaffold.ts";

const webRoot = path.join(process.cwd(), "apps/web");
const catalogPath = path.join(webRoot, "data/v2/catalog-snapshot.json");
const mapPath = path.join(webRoot, "data/v2/map-snapshot.json");
const offersPath = path.join(webRoot, "data/offers-snapshot.json");

let coldBundle;
if (fs.existsSync(catalogPath) && fs.existsSync(mapPath)) {
  coldBundle = {
    catalog: JSON.parse(fs.readFileSync(catalogPath, "utf8")),
    map: JSON.parse(fs.readFileSync(mapPath, "utf8")),
    details: [],
  };
}
let hotSnapshot;
if (fs.existsSync(offersPath)) {
  hotSnapshot = JSON.parse(fs.readFileSync(offersPath, "utf8"));
}
const context = buildMediaInboxContext({ coldBundle, hotSnapshot });
ensureMediaInboxScaffold(context, { webRoot });
`;

const tmp = path.join(ROOT, "scripts", ".media-scaffold-run.mjs");
fs.writeFileSync(tmp, script);
const r = spawnSync(process.execPath, [tsx, tmp], { cwd: ROOT, stdio: "inherit" });
fs.unlinkSync(tmp);
process.exit(r.status ?? 1);
