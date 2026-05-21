import fs from "node:fs";
import path from "node:path";

import { slotsForEntity, type MediaInboxContext } from "./design-pack-slots";
import {
  findInboxSourceFile,
  mediaInboxRoot,
  mediaPlaceholdersRoot,
  outputExists,
  shiftGroupIdToInboxDir,
} from "./inbox-paths";
import { isPlaceholderInboxFile } from "./inbox-placeholder";
import { MEDIA_PRESETS } from "./media-presets";

export type ScaffoldStatus = "placeholder" | "ready" | "missing";

export type ScaffoldLine = {
  inboxSourcePath: string;
  status: ScaffoldStatus;
};

export type EnsureMediaInboxScaffoldResult = {
  lines: ScaffoldLine[];
  placeholderCount: number;
  readyCount: number;
  missingCount: number;
};

export type EnsureMediaInboxScaffoldOptions = {
  webRoot: string;
  /** When false, only report status without copying placeholders */
  writePlaceholders?: boolean;
};

function copyPlaceholder(
  webRoot: string,
  placeholderFile: string,
  destSourcePath: string,
): void {
  const src = path.join(mediaPlaceholdersRoot(webRoot), placeholderFile);
  if (!fs.existsSync(src)) {
    throw new Error(`Placeholder missing: ${src} (run: node scripts/generate-media-placeholders.mjs)`);
  }
  fs.mkdirSync(path.dirname(destSourcePath), { recursive: true });
  fs.copyFileSync(src, destSourcePath);
}

function scaffoldEntity(
  webRoot: string,
  kind: "quest" | "world" | "venue" | "schedule",
  keys: string[],
  options: EnsureMediaInboxScaffoldOptions,
  lines: ScaffoldLine[],
  counts: { placeholder: number; ready: number; missing: number },
): void {
  for (const key of keys) {
    for (const slot of slotsForEntity(kind, key)) {
      const fullInboxPath = path.join(mediaInboxRoot(webRoot), slot.inboxSourcePath);
      const existingPath = findInboxSourceFile(
        webRoot,
        slot.inboxDir,
        slot.sourceFilename,
      );
      const existing =
        existingPath &&
        !isPlaceholderInboxFile(webRoot, existingPath, slot.placeholderFile)
          ? existingPath
          : null;

      const preset = MEDIA_PRESETS[slot.presetId];
      const outputVars: Record<string, string> =
        kind === "schedule"
          ? { shiftGroupId: shiftGroupIdToInboxDir(key) }
          : kind === "venue"
            ? { slug: key, index: slot.sourceFilename.match(/photo-(\d+)/)?.[1] ?? "1" }
            : { slug: key };
      const hasOutput = outputExists(webRoot, preset, outputVars);

      if (existing) {
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "ready" });
        counts.ready += 1;
        continue;
      }

      if (hasOutput) {
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "ready" });
        counts.ready += 1;
        continue;
      }

      if (slot.optional) {
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "missing" });
        counts.missing += 1;
        continue;
      }

      if (options.writePlaceholders !== false) {
        copyPlaceholder(webRoot, slot.placeholderFile, fullInboxPath);
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "placeholder" });
        counts.placeholder += 1;
      } else {
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "missing" });
        counts.missing += 1;
      }
    }
  }
}

export function ensureMediaInboxScaffold(
  context: MediaInboxContext,
  options: EnsureMediaInboxScaffoldOptions,
): EnsureMediaInboxScaffoldResult {
  const lines: ScaffoldLine[] = [];
  const counts = { placeholder: 0, ready: 0, missing: 0 };

  scaffoldEntity(options.webRoot, "quest", context.questSlugs, options, lines, counts);
  scaffoldEntity(options.webRoot, "world", context.worldSlugs, options, lines, counts);
  const { webRoot } = options;
  for (const venue of context.venues) {
    for (const slot of slotsForEntity("venue", venue.scopeSlug)) {
      const fullInboxPath = path.join(mediaInboxRoot(webRoot), slot.inboxSourcePath);
      const existingPath = findInboxSourceFile(
        webRoot,
        slot.inboxDir,
        slot.sourceFilename,
      );
      const existing =
        existingPath &&
        !isPlaceholderInboxFile(webRoot, existingPath, slot.placeholderFile)
          ? existingPath
          : null;
      const photoIndex = slot.sourceFilename.match(/photo-(\d+)/)?.[1] ?? "1";
      const preset = MEDIA_PRESETS[slot.presetId];
      const outputVars: Record<string, string> =
        slot.presetId === "venue_logo"
          ? { slug: venue.scopeSlug }
          : { slug: venue.venueSlug, index: photoIndex };
      const hasOutput = outputExists(webRoot, preset, outputVars);

      if (existing || hasOutput) {
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "ready" });
        counts.ready += 1;
        continue;
      }
      if (slot.optional) {
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "missing" });
        counts.missing += 1;
        continue;
      }
      if (options.writePlaceholders !== false) {
        copyPlaceholder(webRoot, slot.placeholderFile, fullInboxPath);
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "placeholder" });
        counts.placeholder += 1;
      } else {
        lines.push({ inboxSourcePath: slot.inboxSourcePath, status: "missing" });
        counts.missing += 1;
      }
    }
  }
  scaffoldEntity(options.webRoot, "schedule", context.shiftGroupIds, options, lines, counts);

  const result = {
    lines,
    placeholderCount: counts.placeholder,
    readyCount: counts.ready,
    missingCount: counts.missing,
  };

  console.log(
    `[media-scaffold] placeholder=${result.placeholderCount} ready=${result.readyCount} missing=${result.missingCount}`,
  );

  if (result.placeholderCount > 0) {
    console.warn(
      `[media-scaffold] ${result.placeholderCount} slot(s) use placeholder — replace .source.* in media/inbox before go-live`,
    );
  }

  return result;
}

