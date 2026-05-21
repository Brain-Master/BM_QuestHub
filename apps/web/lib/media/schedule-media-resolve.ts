import fs from "node:fs";
import path from "node:path";

import { INBOX_SLOTS } from "./design-pack-slots";
import { readMediaIngestManifest, sha256Buffer } from "./manifest";
import type { ScheduleMediaImage } from "@/lib/schemas";

let placeholderShaCache: Set<string> | null = null;
let placeholderOutputUrlCache: Set<string> | null = null;

export function clearScheduleMediaResolveCaches(): void {
  placeholderShaCache = null;
  placeholderOutputUrlCache = null;
}

export function defaultWebRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "data", "v2", "catalog-snapshot.json"))) {
    return cwd;
  }
  return path.join(cwd, "apps", "web");
}

function knownPlaceholderSha256s(webRoot: string): Set<string> {
  if (placeholderShaCache) return placeholderShaCache;
  const hashes = new Set<string>();
  for (const slot of INBOX_SLOTS) {
    if (!slot.placeholderFile) continue;
    const phPath = path.join(webRoot, "media", "placeholders", slot.placeholderFile);
    if (!fs.existsSync(phPath)) continue;
    hashes.add(sha256Buffer(fs.readFileSync(phPath)));
  }
  placeholderShaCache = hashes;
  return hashes;
}

function normalizeMediaUrlKey(url: string): string {
  const trimmed = url.trim().replace(/\\/g, "/");
  if (trimmed.startsWith("media/")) return trimmed;
  if (trimmed.startsWith("/venues/")) return `media${trimmed}`;
  if (trimmed.startsWith("/media/")) return trimmed.slice(1);
  return trimmed;
}

function knownPlaceholderOutputUrls(webRoot: string): Set<string> {
  if (placeholderOutputUrlCache) return placeholderOutputUrlCache;
  const urls = new Set<string>();
  const placeholderHashes = knownPlaceholderSha256s(webRoot);
  const manifest = readMediaIngestManifest(webRoot);
  for (const entry of Object.values(manifest.entries)) {
    if (!entry.output || !entry.sha256) continue;
    if (!placeholderHashes.has(entry.sha256)) continue;
    urls.add(normalizeMediaUrlKey(entry.output));
  }
  placeholderOutputUrlCache = urls;
  return urls;
}

/** Processed placeholder WebP for schedule/venue photos is typically under 12 KB. */
const PLACEHOLDER_WEBP_MAX_BYTES = 12_000;

function isLikelyPlaceholderWebpOnDisk(webRoot: string, url: string): boolean {
  const rel = normalizeMediaUrlKey(url);
  if (
    !rel.startsWith("media/schedule/") &&
    !rel.startsWith("media/venues/photos/")
  ) {
    return false;
  }
  const diskPath = path.join(webRoot, rel);
  if (!fs.existsSync(diskPath)) return false;
  return fs.statSync(diskPath).size <= PLACEHOLDER_WEBP_MAX_BYTES;
}

/** True when URL points at a gray placeholder (manifest and/or small WebP on disk). */
export function isPlaceholderMediaUrl(
  url: string | undefined,
  webRoot = defaultWebRoot(),
): boolean {
  if (!url?.trim()) return true;
  const key = normalizeMediaUrlKey(url);
  if (knownPlaceholderOutputUrls(webRoot).has(key)) return true;
  return isLikelyPlaceholderWebpOnDisk(webRoot, key);
}

export function questHeroMediaImage(quest: {
  heroImageUrl?: string;
  title: string;
}): ScheduleMediaImage | null {
  const url = quest.heroImageUrl?.trim();
  if (!url) return null;
  return { url, alt: quest.title };
}

/** Schedule slot image, or quest hero when missing / placeholder. */
export function coalesceScheduleMediaImage(
  image: ScheduleMediaImage | null | undefined,
  questFallback: ScheduleMediaImage | null,
  webRoot = defaultWebRoot(),
): ScheduleMediaImage | null {
  if (image?.url?.trim() && !isPlaceholderMediaUrl(image.url, webRoot)) {
    return image;
  }
  return questFallback;
}
