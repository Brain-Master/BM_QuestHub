import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMediaInboxContext } from "../../apps/web/lib/media/ingest-media-inbox.ts";
import type { MediaInboxContext } from "../../apps/web/lib/media/design-pack-slots.ts";

const TS_DIR = path.dirname(fileURLToPath(import.meta.url));

export function repoRootFromScriptsTs(): string {
  return path.resolve(TS_DIR, "../..");
}

export function webRoot(root: string): string {
  return path.join(root, "apps", "web");
}

export function loadMediaInboxContext(root: string): MediaInboxContext {
  const wr = webRoot(root);
  const catalogPath = path.join(wr, "data/v2/catalog-snapshot.json");
  const mapPath = path.join(wr, "data/v2/map-snapshot.json");
  const offersPath = path.join(wr, "data/offers-snapshot.json");

  let coldBundle;
  if (fs.existsSync(catalogPath) && fs.existsSync(mapPath)) {
    coldBundle = {
      catalog: JSON.parse(fs.readFileSync(catalogPath, "utf8")),
      map: JSON.parse(fs.readFileSync(mapPath, "utf8")),
      details: [] as unknown[],
    };
  }

  let hotSnapshot;
  if (fs.existsSync(offersPath)) {
    hotSnapshot = JSON.parse(fs.readFileSync(offersPath, "utf8"));
  }

  return buildMediaInboxContext({ coldBundle, hotSnapshot });
}

export function driveSyncSubfolder(): string {
  return process.env.GOOGLE_MEDIA_DRIVE_INBOX_SUBFOLDER?.trim() || "Sync";
}

export function parseForceFlag(argv: string[]): boolean {
  return argv.includes("--force");
}
