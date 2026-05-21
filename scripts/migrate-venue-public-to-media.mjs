#!/usr/bin/env node
/**
 * One-time: copy venue WebP from apps/web/public/venues/ to apps/web/media/venues/
 * so S3 sync (make s3-sync-media) serves them at media/venues/… without re-ingest.
 *
 *   node scripts/migrate-venue-public-to-media.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const WEB = path.join(ROOT, "apps", "web");
const FROM = path.join(WEB, "public", "venues");
const TO = path.join(WEB, "media", "venues");

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[migrate-venue-media] ${path.relative(WEB, src)} → ${path.relative(WEB, dest)}`);
}

function copyTree(subdir) {
  const fromDir = path.join(FROM, subdir);
  if (!fs.existsSync(fromDir)) {
    console.log(`[migrate-venue-media] skip missing ${fromDir}`);
    return 0;
  }
  let n = 0;
  const walk = (dir, rel = "") => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const relPath = rel ? `${rel}/${name}` : name;
      if (fs.statSync(full).isDirectory()) {
        walk(full, relPath);
        continue;
      }
      if (!/\.webp$/i.test(name)) continue;
      copyFile(full, path.join(TO, subdir, relPath));
      n += 1;
    }
  };
  walk(fromDir);
  return n;
}

function main() {
  const logos = copyTree("logos");
  const photos = copyTree("photos");
  console.log(`[migrate-venue-media] done: ${logos} logos, ${photos} photos`);
  console.log("[migrate-venue-media] next: make s3-sync-media (or make media-push)");
}

main();
