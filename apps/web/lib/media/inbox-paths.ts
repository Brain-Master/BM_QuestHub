import fs from "node:fs";
import path from "node:path";

import type { MediaPreset } from "./media-presets";

const SOURCE_EXT_RE = /\.source\.(jpe?g|png|webp)$/i;

/** Replaces `:` in shift_group_id — illegal in Windows/macOS inbox paths. S3 URLs keep the canonical id. */
export const SHIFT_GROUP_INBOX_DIR_SEP = "__";

export function shiftGroupIdToInboxDir(shiftGroupId: string): string {
  return shiftGroupId.replaceAll(":", SHIFT_GROUP_INBOX_DIR_SEP);
}

/** Map Drive / inbox rel paths to a filesystem-safe schedule segment. */
export function localizeInboxRelPathForFs(relPath: string): string {
  const parts = relPath.replace(/\\/g, "/").split("/");
  if (parts[0] === "schedule" && parts[1]) {
    parts[1] = shiftGroupIdToInboxDir(parts[1]);
  }
  return parts.join(path.sep);
}

export function mediaInboxRoot(webRoot: string): string {
  return path.join(webRoot, "media", "inbox");
}

export function mediaPlaceholdersRoot(webRoot: string): string {
  return path.join(webRoot, "media", "placeholders");
}

export function mediaOutputRoot(webRoot: string): string {
  return path.join(webRoot, "media");
}

export function resolveInboxPath(webRoot: string, inboxRel: string): string {
  return path.join(mediaInboxRoot(webRoot), inboxRel);
}

export function findInboxSourceFile(
  webRoot: string,
  inboxDir: string,
  expectedBasename: string,
): string | null {
  const dir = resolveInboxPath(webRoot, inboxDir);
  const exact = path.join(dir, expectedBasename);
  if (fs.existsSync(exact)) return exact;

  const base = expectedBasename.replace(SOURCE_EXT_RE, "");
  if (!fs.existsSync(dir)) return null;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(base) && SOURCE_EXT_RE.test(name)) {
      return path.join(dir, name);
    }
  }
  return null;
}

export function diskPathFromPattern(
  webRoot: string,
  pattern: string,
  vars: Record<string, string>,
): string {
  let rel = pattern;
  for (const [key, value] of Object.entries(vars)) {
    rel = rel.replaceAll(`{${key}}`, value);
  }
  return path.join(webRoot, rel);
}

export function publicPathFromPattern(
  pattern: string,
  vars: Record<string, string>,
): string {
  let rel = pattern.replace(/^public\//, "");
  for (const [key, value] of Object.entries(vars)) {
    rel = rel.replaceAll(`{${key}}`, value);
  }
  return `/${rel}`;
}

export function canonicalMediaUrl(pattern: string, vars: Record<string, string>): string {
  if (pattern.startsWith("public/")) {
    return publicPathFromPattern(pattern, vars);
  }
  let rel = pattern;
  for (const [key, value] of Object.entries(vars)) {
    rel = rel.replaceAll(`{${key}}`, value);
  }
  return rel;
}

export function outputExists(webRoot: string, preset: MediaPreset, vars: Record<string, string>): boolean {
  return fs.existsSync(diskPathFromPattern(webRoot, preset.outputPattern, vars));
}
