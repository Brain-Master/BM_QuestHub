import mediaIngestManifest from "@/data/media-ingest-manifest.json";
import type { ScheduleMediaImage } from "@/lib/schemas";

/** SHA-256 of files under `media/placeholders/*.placeholder.webp` (stable gray placeholders). */
const PLACEHOLDER_SOURCE_SHA256 = new Set([
  "36cf1bf584511668873f66ede0feeb27da3cc5aba66e99fe8a1a4b50a0342291",
  "747e1e75b029efbc38b2e154deaee4c2dd2b66117ee3cd6b9b985f414719b3ac",
  "11322848692dc67ef6e364c79fcb7fb2cde5ce3a69a6735642ca864dfbe2089b",
  "c9988af3a642d28362479f45c8feb03f9923787408660cae8e175022c6e4889a",
  "af9fb771bc896cf4e2746bb59633db2c8c1af9435fcd9a15193ac2c9a8c24516",
  "2f1fe3d14538b2a0ded59cb06a34c1571df428270cd75fac0f9f79552ee9234c",
  "e7ffa027ae40167239ed7cbd14033adcb129d4a2871cc6ab1089a6ac25d51cba",
  "7b957384dbbaff4a8fce8b311e7cb38e8376ec07708f96ddabe2cc43bcad005a",
]);

function normalizeMediaUrlKey(url: string): string {
  const trimmed = url.trim().replace(/\\/g, "/");
  if (trimmed.startsWith("media/")) return trimmed;
  if (trimmed.startsWith("/venues/")) return `media${trimmed}`;
  if (trimmed.startsWith("/media/")) return trimmed.slice(1);
  return trimmed;
}

function knownPlaceholderOutputUrls(): Set<string> {
  const urls = new Set<string>();
  for (const entry of Object.values(mediaIngestManifest.entries)) {
    if (!entry.output || !entry.sha256) continue;
    if (!PLACEHOLDER_SOURCE_SHA256.has(entry.sha256)) continue;
    urls.add(normalizeMediaUrlKey(entry.output));
  }
  return urls;
}

const placeholderOutputUrls = knownPlaceholderOutputUrls();

/** True when URL points at a gray placeholder listed in the ingest manifest. */
export function isPlaceholderMediaUrl(url: string | undefined): boolean {
  if (!url?.trim()) return true;
  return placeholderOutputUrls.has(normalizeMediaUrlKey(url));
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
): ScheduleMediaImage | null {
  if (image?.url?.trim() && !isPlaceholderMediaUrl(image.url)) {
    return image;
  }
  return questFallback;
}
