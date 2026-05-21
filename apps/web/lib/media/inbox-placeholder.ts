import fs from "node:fs";
import path from "node:path";

import { mediaPlaceholdersRoot } from "./inbox-paths";
import { sha256Buffer } from "./manifest";

const placeholderShaByFile = new Map<string, string>();

function placeholderSha256(webRoot: string, placeholderFile: string): string {
  const cached = placeholderShaByFile.get(placeholderFile);
  if (cached) return cached;
  const src = path.join(mediaPlaceholdersRoot(webRoot), placeholderFile);
  const sha = sha256Buffer(fs.readFileSync(src));
  placeholderShaByFile.set(placeholderFile, sha);
  return sha;
}

/** True when inbox bytes are still the generated gray placeholder (not designer art). */
export function isPlaceholderInboxBytes(
  webRoot: string,
  buffer: Buffer,
  placeholderFile: string,
): boolean {
  if (!placeholderFile) return false;
  return sha256Buffer(buffer) === placeholderSha256(webRoot, placeholderFile);
}

export function isPlaceholderInboxFile(
  webRoot: string,
  sourcePath: string,
  placeholderFile: string,
): boolean {
  if (!fs.existsSync(sourcePath)) return false;
  return isPlaceholderInboxBytes(
    webRoot,
    fs.readFileSync(sourcePath),
    placeholderFile,
  );
}
