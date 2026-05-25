import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type MediaIngestManifestEntry = {
  sourceUrl: string;
  sha256: string;
  output: string;
  updatedAt: string;
  caption?: string;
};

export type MediaIngestManifest = {
  version: 1;
  entries: Record<string, MediaIngestManifestEntry>;
};

function defaultManifest(): MediaIngestManifest {
  return { version: 1, entries: {} };
}

export function manifestPath(webRoot: string): string {
  return path.join(webRoot, "data", "media-ingest-manifest.json");
}

export function readMediaIngestManifest(webRoot: string): MediaIngestManifest {
  const file = manifestPath(webRoot);
  if (!fs.existsSync(file)) return defaultManifest();
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as MediaIngestManifest;
  return {
    version: 1,
    entries: raw.entries ?? {},
  };
}

export function writeMediaIngestManifest(
  webRoot: string,
  manifest: MediaIngestManifest,
): void {
  const file = manifestPath(webRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/** Skip re-processing when source (URL or inbox path) and content hash unchanged. */
export function shouldSkipIngest(
  manifest: MediaIngestManifest,
  key: string,
  sourceKey: string,
  sha256: string,
): boolean {
  if (process.env.MEDIA_INGEST_FORCE === "1") return false;
  const entry = manifest.entries[key];
  return (
    entry?.sourceUrl === sourceKey &&
    entry.sha256 === sha256 &&
    Boolean(entry.output)
  );
}
