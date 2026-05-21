import type { MediaPresetId } from "./media-presets";

export type InboxEntityKind = "quest" | "world" | "venue" | "schedule";

export type InboxSlotDef = {
  id: string;
  entityKind: InboxEntityKind;
  /** Path under `media/inbox/`; `{slug}` or `{shiftGroupId}` or `{index}` */
  inboxDirPattern: string;
  /** Designer filename in inbox (e.g. hero-16x9.source.jpg) */
  sourceFilename: string;
  placeholderFile: string;
  presetId: MediaPresetId;
  optional?: boolean;
};

/** Canonical inbox tree — mirrors Google Drive `BM_QuestHub_Media/`. */
export const INBOX_SLOTS: InboxSlotDef[] = [
  {
    id: "quest_hero",
    entityKind: "quest",
    inboxDirPattern: "quests/{slug}",
    sourceFilename: "hero-16x9.source.jpg",
    placeholderFile: "quest-hero-16x9.placeholder.webp",
    presetId: "course_hero_image",
  },
  {
    id: "quest_catalog",
    entityKind: "quest",
    inboxDirPattern: "quests/{slug}",
    sourceFilename: "catalog-4x3.source.jpg",
    placeholderFile: "quest-catalog-4x3.placeholder.webp",
    presetId: "course_catalog_image",
  },
  {
    id: "quest_og",
    entityKind: "quest",
    inboxDirPattern: "quests/{slug}",
    sourceFilename: "og-1200x630.source.jpg",
    placeholderFile: "og-1200x630.placeholder.webp",
    presetId: "og_share",
    optional: true,
  },
  {
    id: "world_hero",
    entityKind: "world",
    inboxDirPattern: "worlds/{slug}",
    sourceFilename: "hero-16x9.source.jpg",
    placeholderFile: "world-hero-16x9.placeholder.webp",
    presetId: "world_hero_image",
  },
  {
    id: "venue_logo",
    entityKind: "venue",
    inboxDirPattern: "venues/{slug}",
    sourceFilename: "logo-256.source.png",
    placeholderFile: "venue-logo-256.placeholder.webp",
    presetId: "venue_logo",
  },
  {
    id: "venue_photo_1",
    entityKind: "venue",
    inboxDirPattern: "venues/{slug}",
    sourceFilename: "photo-01-16x10.source.jpg",
    placeholderFile: "venue-photo-16x10.placeholder.webp",
    presetId: "venue_photo",
  },
  {
    id: "venue_photo_2",
    entityKind: "venue",
    inboxDirPattern: "venues/{slug}",
    sourceFilename: "photo-02-16x10.source.jpg",
    placeholderFile: "venue-photo-16x10.placeholder.webp",
    presetId: "venue_photo",
    optional: true,
  },
  {
    id: "venue_photo_3",
    entityKind: "venue",
    inboxDirPattern: "venues/{slug}",
    sourceFilename: "photo-03-16x10.source.jpg",
    placeholderFile: "venue-photo-16x10.placeholder.webp",
    presetId: "venue_photo",
    optional: true,
  },
  {
    id: "venue_photo_4",
    entityKind: "venue",
    inboxDirPattern: "venues/{slug}",
    sourceFilename: "photo-04-16x10.source.jpg",
    placeholderFile: "venue-photo-16x10.placeholder.webp",
    presetId: "venue_photo",
    optional: true,
  },
  {
    id: "schedule_hero",
    entityKind: "schedule",
    inboxDirPattern: "schedule/{shiftGroupId}",
    sourceFilename: "hero-16x9.source.jpg",
    placeholderFile: "schedule-hero-16x9.placeholder.webp",
    presetId: "schedule_card_hero",
  },
  {
    id: "schedule_compact",
    entityKind: "schedule",
    inboxDirPattern: "schedule/{shiftGroupId}",
    sourceFilename: "compact-4x3.source.jpg",
    placeholderFile: "schedule-compact-4x3.placeholder.webp",
    presetId: "schedule_card_compact",
  },
];

export const QUEST_VIDEO_INBOX = {
  inboxDirPattern: "quests/{slug}",
  sourceFilename: "hero.mp4",
} as const;

export const WORLD_VIDEO_INBOX = {
  inboxDirPattern: "worlds/{slug}",
  sourceFilename: "hero.mp4",
} as const;

export type VenueInboxRef = {
  /** Inbox folder key (school_scope_slug or slug) */
  scopeSlug: string;
  /** Output path key for photos */
  venueSlug: string;
};

export type MediaInboxContext = {
  questSlugs: string[];
  worldSlugs: string[];
  venues: VenueInboxRef[];
  shiftGroupIds: string[];
};

export function slotsForEntity(
  kind: InboxEntityKind,
  key: string,
): Array<InboxSlotDef & { inboxDir: string; inboxSourcePath: string }> {
  const token = kind === "schedule" ? "{shiftGroupId}" : "{slug}";
  const value = key;
  return INBOX_SLOTS.filter((s) => s.entityKind === kind).map((slot) => {
    const inboxDir = slot.inboxDirPattern.replace(token, value);
    return {
      ...slot,
      inboxDir,
      inboxSourcePath: `${inboxDir}/${slot.sourceFilename}`,
    };
  });
}

/** CSV rows for design pack */
export function designPackCsvRows(): string[][] {
  const header = [
    "entity",
    "key",
    "slot_id",
    "inbox_path",
    "source_filename",
    "output_preset",
  ];
  const rows: string[][] = [header];
  for (const slot of INBOX_SLOTS) {
    const keyToken =
      slot.entityKind === "schedule" ? "{shift_group_id}" : "{slug}";
    const inboxExample = `Sync/${slot.inboxDirPattern}/${slot.sourceFilename}`.replace(
      "{shiftGroupId}",
      keyToken,
    );
    rows.push([
      slot.entityKind,
      keyToken,
      slot.id,
      inboxExample,
      slot.sourceFilename,
      slot.presetId,
    ]);
  }
  return rows;
}
