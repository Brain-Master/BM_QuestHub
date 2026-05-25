import fs from "node:fs";
import path from "node:path";

import {
  INBOX_SLOTS,
  QUEST_VIDEO_INBOX,
  VENUE_LANDING_VIDEO_INBOX,
  WORLD_VIDEO_INBOX,
  schoolLandingScopeSlugs,
  slotsForEntity,
  slotsForSchoolLandingScope,
  type InboxSlotDef,
  type MediaInboxContext,
} from "./design-pack-slots";
import {
  findInboxSourceFile,
  mediaInboxRoot,
  mediaPlaceholdersRoot,
} from "./inbox-paths";

export type InboxSlotEntry = {
  slotId: string;
  entityKind: InboxSlotDef["entityKind"];
  inboxRelPath: string;
  inboxDir: string;
  driveFileName: string;
  placeholderFile: string;
  optional?: boolean;
  isVideo?: boolean;
};

export type SlotUploadPayload =
  | {
      action: "upload";
      localPath: string;
      driveFileName: string;
      payloadKind: "source" | "placeholder";
    }
  | { action: "skip"; reason: "drive_exists" | "optional_video_missing" };

const VIDEO_MP4_RE = /^(hero|landing-30s)\.mp4$/i;
const CAPTION_TXT_RE = /^gallery-\d+\.caption\.txt$/i;

/** All inbox files to mirror under Drive `Sync/`. */
export function enumerateInboxSlots(context: MediaInboxContext): InboxSlotEntry[] {
  const entries: InboxSlotEntry[] = [];

  for (const slug of context.questSlugs) {
    for (const slot of slotsForEntity("quest", slug)) {
      entries.push(slotToEntry(slot));
    }
    entries.push(videoEntry("quest", slug, QUEST_VIDEO_INBOX));
  }

  for (const slug of context.worldSlugs) {
    for (const slot of slotsForEntity("world", slug)) {
      entries.push(slotToEntry(slot));
    }
    entries.push(videoEntry("world", slug, WORLD_VIDEO_INBOX));
  }

  for (const venue of context.venues) {
    for (const slot of slotsForEntity("venue", venue.scopeSlug)) {
      entries.push(slotToEntry(slot));
    }
  }

  for (const shiftGroupId of context.shiftGroupIds) {
    for (const slot of slotsForEntity("schedule", shiftGroupId)) {
      entries.push(slotToEntry(slot));
    }
  }

  for (const scope of schoolLandingScopeSlugs(context)) {
    entries.push(venueLandingVideoEntry(scope));
    for (const slot of slotsForSchoolLandingScope(scope)) {
      entries.push(schoolLandingSlotToEntry(slot));
    }
  }

  return entries;
}

function slotToEntry(
  slot: InboxSlotDef & { inboxDir: string; inboxSourcePath: string },
): InboxSlotEntry {
  return {
    slotId: slot.id,
    entityKind: slot.entityKind,
    inboxRelPath: slot.inboxSourcePath,
    inboxDir: slot.inboxDir,
    driveFileName: slot.sourceFilename,
    placeholderFile: slot.placeholderFile,
    optional: slot.optional,
  };
}

function videoEntry(
  entityKind: "quest" | "world",
  slug: string,
  pattern: { inboxDirPattern: string; sourceFilename: string },
): InboxSlotEntry {
  const inboxDir = pattern.inboxDirPattern.replace("{slug}", slug);
  const inboxRelPath = `${inboxDir}/${pattern.sourceFilename}`;
  return {
    slotId: `${entityKind}_video`,
    entityKind,
    inboxRelPath,
    inboxDir,
    driveFileName: pattern.sourceFilename,
    placeholderFile: "",
    optional: true,
    isVideo: true,
  };
}

function venueLandingVideoEntry(scope: string): InboxSlotEntry {
  const inboxDir = VENUE_LANDING_VIDEO_INBOX.inboxDirPattern.replace("{scope}", scope);
  const inboxRelPath = `${inboxDir}/${VENUE_LANDING_VIDEO_INBOX.sourceFilename}`;
  return {
    slotId: "venue_landing_video",
    entityKind: "venue",
    inboxRelPath,
    inboxDir,
    driveFileName: VENUE_LANDING_VIDEO_INBOX.sourceFilename,
    placeholderFile: "",
    optional: true,
    isVideo: true,
  };
}

function schoolLandingSlotToEntry(
  slot: ReturnType<typeof slotsForSchoolLandingScope>[number],
): InboxSlotEntry {
  return {
    slotId: slot.id,
    entityKind: slot.entityKind,
    inboxRelPath: slot.inboxSourcePath,
    inboxDir: slot.inboxDir,
    driveFileName: slot.sourceFilename,
    placeholderFile: slot.placeholderFile,
    optional: slot.optional,
  };
}

export function isInboxPullPath(relPath: string): boolean {
  const base = path.basename(relPath);
  if (VIDEO_MP4_RE.test(base)) return true;
  if (CAPTION_TXT_RE.test(base)) return true;
  return /\.source\.(jpe?g|png|webp)$/i.test(base);
}

export function resolveLocalSourcePath(
  webRoot: string,
  entry: InboxSlotEntry,
): string | null {
  if (entry.isVideo) {
    const exact = path.join(mediaInboxRoot(webRoot), entry.inboxRelPath);
    return fs.existsSync(exact) ? exact : null;
  }
  return findInboxSourceFile(webRoot, entry.inboxDir, entry.driveFileName);
}

export function resolvePlaceholderPath(webRoot: string, entry: InboxSlotEntry): string {
  return path.join(mediaPlaceholdersRoot(webRoot), entry.placeholderFile);
}

/** Decide upload vs skip for one Drive slot (pure, testable). */
export function planSlotPush(options: {
  driveFileExists: boolean;
  localSourcePath: string | null;
  force: boolean;
  isVideo?: boolean;
  optional?: boolean;
}): SlotUploadPayload {
  const { driveFileExists, localSourcePath, force, isVideo, optional } = options;

  if (isVideo && !localSourcePath) {
    return { action: "skip", reason: "optional_video_missing" };
  }

  if (driveFileExists && !force) {
    return { action: "skip", reason: "drive_exists" };
  }

  if (localSourcePath) {
    return {
      action: "upload",
      localPath: localSourcePath,
      driveFileName: path.basename(localSourcePath),
      payloadKind: "source",
    };
  }

  return {
    action: "upload",
    localPath: "",
    driveFileName: "",
    payloadKind: "placeholder",
  };
}

export function buildSlotUploadPayload(
  webRoot: string,
  entry: InboxSlotEntry,
  driveFileExists: boolean,
  force: boolean,
): SlotUploadPayload {
  const localSourcePath = resolveLocalSourcePath(webRoot, entry);
  const planned = planSlotPush({
    driveFileExists,
    localSourcePath,
    force,
    isVideo: entry.isVideo,
    optional: entry.optional,
  });

  if (planned.action === "skip") return planned;

  if (planned.payloadKind === "source" && localSourcePath) {
    return {
      action: "upload",
      localPath: localSourcePath,
      driveFileName: entry.driveFileName,
      payloadKind: "source",
    };
  }

  if (entry.isVideo) {
    return { action: "skip", reason: "optional_video_missing" };
  }

  return {
    action: "upload",
    localPath: resolvePlaceholderPath(webRoot, entry),
    driveFileName: entry.driveFileName,
    payloadKind: "placeholder",
  };
}
