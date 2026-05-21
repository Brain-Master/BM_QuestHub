import fs from "node:fs";
import path from "node:path";

import {
  coalesceScheduleMediaImage as coalesceScheduleMediaImageBase,
  isPlaceholderMediaUrl as isPlaceholderMediaUrlFromManifest,
  questHeroMediaImage,
} from "./schedule-media-coalesce";

export { questHeroMediaImage };

export function clearScheduleMediaResolveCaches(): void {
  /* manifest-based placeholder set is static; no runtime cache */
}

export function defaultWebRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "data", "v2", "catalog-snapshot.json"))) {
    return cwd;
  }
  return path.join(cwd, "apps", "web");
}

/** Processed placeholder WebP for schedule/venue photos is typically under 12 KB. */
const PLACEHOLDER_WEBP_MAX_BYTES = 12_000;

function normalizeMediaUrlKey(url: string): string {
  const trimmed = url.trim().replace(/\\/g, "/");
  if (trimmed.startsWith("media/")) return trimmed;
  if (trimmed.startsWith("/venues/")) return `media${trimmed}`;
  if (trimmed.startsWith("/media/")) return trimmed.slice(1);
  return trimmed;
}

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
  if (isPlaceholderMediaUrlFromManifest(url)) return true;
  if (!url?.trim()) return true;
  return isLikelyPlaceholderWebpOnDisk(webRoot, url);
}

export function coalesceScheduleMediaImage(
  image: Parameters<typeof coalesceScheduleMediaImageBase>[0],
  questFallback: Parameters<typeof coalesceScheduleMediaImageBase>[1],
  webRoot = defaultWebRoot(),
): ReturnType<typeof coalesceScheduleMediaImageBase> {
  if (image?.url?.trim() && !isPlaceholderMediaUrl(image.url, webRoot)) {
    return image;
  }
  return questFallback;
}
