/**
 * Ingest presets for media pipeline (sharp/ffmpeg).
 * Design slot IDs match docs/design/image-templates-index.md (human-facing specs).
 */

export type DesignSlotId =
  | "schedule_hero"
  | "schedule_compact"
  | "schedule_mobile_thumb"
  | "quest_hero"
  | "quest_hero_poster"
  | "world_hero"
  | "quest_catalog"
  | "city_card"
  | "venue_logo"
  | "venue_photo"
  | "og_social";

export type MediaPresetId =
  | "course_hero_image"
  | "course_catalog_image"
  | "course_hero_video"
  | "world_hero_image"
  | "venue_logo"
  | "venue_photo"
  | "schedule_card_hero"
  | "schedule_card_compact"
  | "og_share";

export type MediaFit = "cover" | "contain";

export type MediaPreset = {
  id: MediaPresetId;
  /** Same IDs as image-templates-index.md */
  designSlotIds: DesignSlotId[];
  aspectRatio: { w: number; h: number };
  maxWidth: number;
  maxHeight: number;
  format: "webp";
  fit: MediaFit;
  quality?: number;
  /** Output path template; `{slug}` replaced at ingest */
  outputPattern: string;
};

/** Ingest preset → design slots (see image-templates-index.md mapping table). */
export const MEDIA_PRESETS: Record<MediaPresetId, MediaPreset> = {
  course_hero_image: {
    id: "course_hero_image",
    designSlotIds: ["quest_hero"],
    aspectRatio: { w: 16, h: 9 },
    maxWidth: 2400,
    maxHeight: 1350,
    format: "webp",
    fit: "cover",
    quality: 82,
    outputPattern: "media/quests/{slug}/hero.webp",
  },
  course_catalog_image: {
    id: "course_catalog_image",
    designSlotIds: ["quest_catalog"],
    aspectRatio: { w: 4, h: 3 },
    maxWidth: 1600,
    maxHeight: 1200,
    format: "webp",
    fit: "cover",
    quality: 82,
    outputPattern: "media/quests/{slug}/catalog.webp",
  },
  course_hero_video: {
    id: "course_hero_video",
    designSlotIds: ["quest_hero_poster"],
    aspectRatio: { w: 16, h: 9 },
    maxWidth: 1280,
    maxHeight: 720,
    format: "webp",
    fit: "cover",
    quality: 80,
    outputPattern: "media/quests/{slug}/poster.webp",
  },
  world_hero_image: {
    id: "world_hero_image",
    designSlotIds: ["world_hero"],
    aspectRatio: { w: 16, h: 9 },
    maxWidth: 2400,
    maxHeight: 1350,
    format: "webp",
    fit: "cover",
    quality: 82,
    outputPattern: "media/worlds/{slug}/hero.webp",
  },
  venue_logo: {
    id: "venue_logo",
    designSlotIds: ["venue_logo"],
    aspectRatio: { w: 1, h: 1 },
    maxWidth: 128,
    maxHeight: 128,
    format: "webp",
    fit: "contain",
    quality: 80,
    outputPattern: "public/venues/logos/{slug}.webp",
  },
  venue_photo: {
    id: "venue_photo",
    designSlotIds: ["venue_photo"],
    aspectRatio: { w: 16, h: 10 },
    maxWidth: 1280,
    maxHeight: 800,
    format: "webp",
    fit: "cover",
    quality: 82,
    outputPattern: "public/venues/photos/{slug}/{index}.webp",
  },
  schedule_card_hero: {
    id: "schedule_card_hero",
    designSlotIds: ["schedule_hero"],
    aspectRatio: { w: 16, h: 9 },
    maxWidth: 2400,
    maxHeight: 1350,
    format: "webp",
    fit: "cover",
    quality: 82,
    outputPattern: "media/schedule/{shiftGroupId}/hero.webp",
  },
  schedule_card_compact: {
    id: "schedule_card_compact",
    designSlotIds: ["schedule_compact", "schedule_mobile_thumb"],
    aspectRatio: { w: 4, h: 3 },
    maxWidth: 1200,
    maxHeight: 800,
    format: "webp",
    fit: "cover",
    quality: 82,
    outputPattern: "media/schedule/{shiftGroupId}/compact.webp",
  },
  og_share: {
    id: "og_share",
    designSlotIds: ["og_social"],
    aspectRatio: { w: 1200, h: 630 },
    maxWidth: 1200,
    maxHeight: 630,
    format: "webp",
    fit: "cover",
    quality: 85,
    outputPattern: "media/quests/{slug}/og.webp",
  },
};

/** Design slot → primary ingest preset (slots without ingest return undefined). */
export const DESIGN_SLOT_TO_PRESET: Partial<Record<DesignSlotId, MediaPresetId>> = {
  schedule_hero: "schedule_card_hero",
  schedule_compact: "schedule_card_compact",
  schedule_mobile_thumb: "schedule_card_compact",
  quest_hero: "course_hero_image",
  quest_catalog: "course_catalog_image",
  quest_hero_poster: "course_hero_video",
  world_hero: "world_hero_image",
  venue_logo: "venue_logo",
  venue_photo: "venue_photo",
  og_social: "og_share",
};

export function getPresetForDesignSlot(
  slotId: DesignSlotId,
): MediaPreset | undefined {
  const presetId = DESIGN_SLOT_TO_PRESET[slotId];
  return presetId ? MEDIA_PRESETS[presetId] : undefined;
}
