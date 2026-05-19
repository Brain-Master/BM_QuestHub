import { z } from "zod";

/** Обязательные заголовки (после нормализации в snake_case). */
export const REQUIRED_SHEET_HEADERS = [
  "program_name",
  "quest_slug",
  "venue_slug",
  "start_date",
  "end_date",
  "start_time",
  "end_time",
  "price",
  "school_name",
  "address",
  "status",
] as const;

export function normalizeHeaderCell(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^\d{1,2}:\d{2}$/;

function optionalIntPositive() {
  return z.preprocess((v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "string" && v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }, z.number().int().positive().optional());
}

function optionalIntNonneg() {
  return z.preprocess((v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "string" && v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }, z.number().int().nonnegative().optional());
}

function optionalBool() {
  return z.preprocess((v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v !== "string") return v;
    const t = v.trim().toLowerCase();
    if (!t) return undefined;
    if (["1", "true", "yes", "y", "да", "истина"].includes(t)) return true;
    if (["0", "false", "no", "n", "нет", "ложь"].includes(t)) return false;
    return v;
  }, z.boolean().optional());
}

function optionalRegistrationChannel() {
  return z.preprocess((v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v !== "string") return v;
    const t = v.trim().toLowerCase();
    if (!t) return undefined;
    if (["mos", "mos.ru", "mos_ru", "mosru", "моссру", "мосру"].includes(t)) {
      return "mos_ru";
    }
    if (["brainmaster", "bm", "direct", "direct_bm", "напрямую"].includes(t)) {
      return "brainmaster";
    }
    return t;
  }, z.enum(["mos_ru", "brainmaster"]).optional());
}

function optionalPercent() {
  return z.preprocess((v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "string" && v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }, z.number().min(0).max(100).optional());
}

/** Одна строка листа после склейки с заголовками. */
export const sheetRowSchema = z.object({
  venue_slug: z.string().min(1),
  quest_slug: z.string().min(1),
  program_name: z.string().min(1),
  school_name: z.string().min(1),
  metro_station: z.string().optional(),
  teacher: z.string().optional(),
  address: z.string().min(1),
  start_date: z.string().regex(dateRe, "Ожидается YYYY-MM-DD"),
  end_date: z.string().regex(dateRe, "Ожидается YYYY-MM-DD"),
  start_time: z.string().regex(timeRe, "Ожидается HH:MM"),
  end_time: z.string().regex(timeRe, "Ожидается HH:MM"),
  age_group: z.string().optional(),
  price: z.coerce.number().int().nonnegative(),
  mos_ru_code: z.string().optional(),
  mos_ru_link: z.string().optional(),
  max_capacity: optionalIntPositive(),
  enrolled: optionalIntNonneg(),
  status: z.string().min(1),
  notes: z.string().optional(),
  registration_channel: optionalRegistrationChannel(),
  allow_preliminary_registration: optionalBool(),
  display_title: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  format_type: z.string().optional(),
  format_time: z.string().optional(),
  format_note: z.string().optional(),
  is_archived: optionalBool(),
  allow_waitlist_when_sold_out: optionalBool(),
  hero_image_url: z.string().optional(),
  compact_image_url: z.string().optional(),
  fallback_image_url: z.string().optional(),
  image_alt: z.string().optional(),
  image_focal_x: optionalPercent(),
  image_focal_y: optionalPercent(),
});

export type SheetRow = z.infer<typeof sheetRowSchema>;

export function validateHeaderRow(headers: string[]): {
  ok: true;
  normalized: string[];
} | {
  ok: false;
  message: string;
} {
  const normalized = headers.map((h) => normalizeHeaderCell(h));
  const missing = REQUIRED_SHEET_HEADERS.filter(
    (req) => !normalized.includes(req),
  );
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Не хватает колонок: ${missing.join(", ")}. Есть: ${normalized.filter(Boolean).join(", ")}`,
    };
  }
  return { ok: true, normalized };
}
