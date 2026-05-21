import { z } from "zod";



import {

  productFormatSchema,

  questSchema,

  venueSchema,

  worldSchema,

} from "@/lib/schemas";



export function normalizeHeaderCell(raw: string): string {

  return raw

    .trim()

    .toLowerCase()

    .replace(/\s+/g, "_")

    .replace(/[^a-z0-9_]/g, "");

}



export function validateHeaderRow(

  headers: string[],

  required: readonly string[],

):

  | { ok: true; normalized: string[] }

  | { ok: false; message: string } {

  const normalized = headers.map((h) => normalizeHeaderCell(h));

  const missing = required.filter((req) => !normalized.includes(req));

  if (missing.length > 0) {

    return {

      ok: false,

      message: `Не хватает колонок: ${missing.join(", ")}. Есть: ${normalized.filter(Boolean).join(", ")}`,

    };

  }

  return { ok: true, normalized };

}



function splitList(raw: string | undefined): string[] {

  if (!raw?.trim()) return [];

  return raw

    .split(/[;|]/)

    .map((s) => s.trim())

    .filter(Boolean);

}



function optionalBool() {

  return z.preprocess((v) => {

    if (v === undefined || v === null) return undefined;

    if (typeof v !== "string") return v;

    const t = v.trim().toLowerCase();

    if (!t) return undefined;

    if (["1", "true", "yes", "y", "да"].includes(t)) return true;

    if (["0", "false", "no", "n", "нет"].includes(t)) return false;

    return v;

  }, z.boolean().optional());

}



function optionalNumber() {

  return z.preprocess((v) => {

    if (v === undefined || v === null) return undefined;

    if (typeof v === "string" && v.trim() === "") return undefined;

    const n = Number(v);

    return Number.isFinite(n) ? n : v;

  }, z.number().optional());

}



/** Must exist on the sheet header row. */

export const WORLD_REQUIRED_HEADERS = [

  "slug",

  "name",

  "description",

  "theme_key",

  "tagline",

  "pitch",

  "highlights",

] as const;



/** Optional columns (seed adds them; legacy sheets may omit). */

export const WORLD_OPTIONAL_HEADERS = [

  "hero_video_embed_url",

  "card_gradient",

  "card_glow",

  "icon_key",

] as const;



export const WORLD_HEADERS = [

  ...WORLD_REQUIRED_HEADERS,

  ...WORLD_OPTIONAL_HEADERS,

] as const;



/** Must exist on the sheet header row. */

export const VENUE_REQUIRED_HEADERS = [

  "slug",

  "name",

  "display_name",

  "type",

  "address",

  "metro",

  "city",

  "district",

  "latitude",

  "longitude",

  "school_scope_slug",

  "listed_on_sites",

  "directions",

  "entrance_note",

  "contact_note",

] as const;



export const VENUE_HEADERS = [...VENUE_REQUIRED_HEADERS] as const;



export const COURSE_REQUIRED_HEADERS = [

  "slug",

  "world_slug",

  "title",

  "tagline",

  "age_label",

  "format",

  "skills",

  "story",

  "skills_parent",

  "loot",

  "approach",

] as const;



export const COURSE_OPTIONAL_HEADERS = [

  "catalog_tagline",

  "active_in_campaign",

  "hero_video_embed_url",

  "group_size",

  "duration_label",

  "price_hint",

] as const;



export const COURSE_HEADERS = [

  ...COURSE_REQUIRED_HEADERS,

  ...COURSE_OPTIONAL_HEADERS,

] as const;



const worldRowSchema = z.object({

  slug: z.string().min(1),

  name: z.string().min(1),

  description: z.string().min(1),

  theme_key: z.string().min(1),

  tagline: z.string().min(1),

  pitch: z.string().min(1),

  highlights: z.string().min(1),

  hero_video_embed_url: z.string().optional(),

  card_gradient: z.string().optional(),

  card_glow: z.string().optional(),

  icon_key: z.preprocess(
    (v) => (typeof v === "string" && !v.trim() ? undefined : v),
    z.enum(["blocks", "cpu", "waves", "orbit"]).optional(),
  ),

});



const venueRowSchema = z.object({

  slug: z.string().min(1),

  name: z.string().min(1),

  display_name: z.string().optional(),

  type: z.enum(["school", "bm_base"]),

  address: z.string().min(1),

  metro: z.string().optional(),

  city: z.string().optional(),

  district: z.string().optional(),

  latitude: optionalNumber(),

  longitude: optionalNumber(),

  school_scope_slug: z.string().optional(),

  listed_on_sites: optionalBool(),

  directions: z.string().optional(),

  entrance_note: z.string().optional(),

  contact_note: z.string().optional(),

});



const courseRowSchema = z.object({

  slug: z.string().min(1),

  world_slug: z.string().min(1),

  title: z.string().min(1),

  tagline: z.string().min(1),

  catalog_tagline: z.string().optional(),

  age_label: z.string().min(1),

  format: productFormatSchema,

  skills: z.string().min(1),

  active_in_campaign: optionalBool(),

  hero_video_embed_url: z.string().optional(),

  group_size: z.string().optional(),

  duration_label: z.string().optional(),

  price_hint: z.string().optional(),

  story: z.string().min(1),

  skills_parent: z.string().min(1),

  loot: z.string().min(1),

  approach: z.string().min(1),

});



export function rowObject(

  headers: string[],

  cells: string[],

): Record<string, string> {

  const o: Record<string, string> = {};

  for (let i = 0; i < headers.length; i++) {

    const key = headers[i];

    if (!key) continue;

    o[key] = cells[i] === undefined || cells[i] === null ? "" : String(cells[i]);

  }

  return o;

}



export function isBlankRow(cells: string[]): boolean {

  return cells.every((c) => !String(c).trim());

}



/** Skip empty rows and spacer rows without a slug (common below the data table). */

export function isSkippableDataRow(

  cells: string[],

  headers: string[],

  slugKey = "slug",

): boolean {

  if (isBlankRow(cells)) return true;

  const slugIdx = headers.indexOf(slugKey);

  if (slugIdx < 0) return false;

  return !String(cells[slugIdx] ?? "").trim();

}



export function parseWorldRow(obj: Record<string, string>) {

  const parsed = worldRowSchema.safeParse(obj);

  if (!parsed.success) return parsed;

  const r = parsed.data;

  const world = {

    slug: r.slug,

    name: r.name,

    description: r.description,

    themeKey: r.theme_key,

    tagline: r.tagline,

    pitch: r.pitch,

    highlights: splitList(r.highlights),

    heroVideoEmbedUrl: r.hero_video_embed_url || undefined,

    presentation:

      r.card_gradient && r.card_glow && r.icon_key

        ? {

            cardGradient: r.card_gradient,

            cardGlow: r.card_glow,

            iconKey: r.icon_key,

          }

        : undefined,

  };

  return worldSchema.safeParse(world);

}



export function parseVenueRow(obj: Record<string, string>) {

  const parsed = venueRowSchema.safeParse(obj);

  if (!parsed.success) return parsed;

  const r = parsed.data;

  const venue = {

    slug: r.slug,

    name: r.name,

    displayName: r.display_name || undefined,

    type: r.type,

    address: r.address,

    metro: r.metro || undefined,

    city: r.city || undefined,

    district: r.district || undefined,

    latitude: r.latitude,

    longitude: r.longitude,

    schoolScopeSlug: r.school_scope_slug || undefined,

    listedOnSites: r.listed_on_sites ?? true,

    directions: splitList(r.directions),

    entranceNote: r.entrance_note || undefined,

    contactNote: r.contact_note || undefined,

  };

  return venueSchema.safeParse(venue);

}



export function parseCourseRow(obj: Record<string, string>) {

  const parsed = courseRowSchema.safeParse(obj);

  if (!parsed.success) return parsed;

  const r = parsed.data;

  const course = {

    slug: r.slug,

    worldSlug: r.world_slug,

    title: r.title,

    tagline: r.tagline,

    catalogTagline: r.catalog_tagline || undefined,

    ageLabel: r.age_label,

    format: r.format,

    skills: splitList(r.skills),

    activeInCampaign: r.active_in_campaign ?? true,

    heroVideoEmbedUrl: r.hero_video_embed_url || undefined,

    groupSize: r.group_size || undefined,

    durationLabel: r.duration_label || undefined,

    priceHint: r.price_hint || undefined,

    story: r.story,

    skillsParent: r.skills_parent,

    loot: r.loot,

    approach: r.approach,

    offers: [],

  };

  return questSchema.safeParse(course);

}

