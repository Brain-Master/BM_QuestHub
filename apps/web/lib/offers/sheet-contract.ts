import { z } from "zod";

import {
  normalizeSheetText,
  parseSheetBool,
  parseSheetDate,
  parseSheetMosRuCode,
  parseSheetNonNegativeInt,
  parseSheetPercent,
  parseSheetPositiveInt,
  parseSheetPrice,
  parseSheetRegistrationChannel,
  parseSheetTime,
  parseSheetUrl,
} from "./sheet-field-parsers";
import { normalizeHeaderCell } from "./sheet-header";
import { splitProgramName } from "./program-name";

export { normalizeHeaderCell };

/** Лист «Группы» — одна строка = одна смена. */
export const GROUP_REQUIRED_HEADERS = [
  "shift_group_id",
  "program_name_h2",
  "quest_slug",
  "venue_slug",
  "start_date",
  "end_date",
  "address",
  "status",
] as const;

/** Лист «Форматы» — одна строка = один тариф; shift_group_id → группа. */
export const FORMAT_REQUIRED_HEADERS = [
  "shift_group_id",
  "start_time",
  "end_time",
  "price",
] as const;

/** @deprecated use GROUP_REQUIRED_HEADERS + FORMAT_REQUIRED_HEADERS */
export const REQUIRED_SHEET_HEADERS = [
  ...GROUP_REQUIRED_HEADERS,
  "start_time",
  "end_time",
  "price",
  "school_name",
] as const;

export const RECOMMENDED_GROUP_HEADERS = ["program_name_h1", "school_name"] as const;

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^\d{1,2}:\d{2}$/;

function requiredParsedDate(field: string) {
  return z.preprocess(
    (v) => parseSheetDate(v) ?? v,
    z.string().regex(dateRe, `Ожидается YYYY-MM-DD (${field})`),
  );
}

function requiredParsedTime(field: string) {
  return z.preprocess(
    (v) => parseSheetTime(v) ?? v,
    z.string().regex(timeRe, `Ожидается H:MM (${field})`),
  );
}

function requiredPrice() {
  return z.preprocess(
    (v) => parseSheetPrice(v),
    z.number({ error: "Некорректная цена" }).int().nonnegative(),
  );
}

function optionalIntPositive() {
  return z.preprocess(
    (v) => parseSheetPositiveInt(v),
    z.number().int().positive().optional(),
  );
}

function optionalIntNonneg() {
  return z.preprocess(
    (v) => parseSheetNonNegativeInt(v),
    z.number().int().nonnegative().optional(),
  );
}

function optionalBool() {
  return z.preprocess((v) => parseSheetBool(v), z.boolean().optional());
}

function optionalRegistrationChannel() {
  return z.preprocess(
    (v) => parseSheetRegistrationChannel(v),
    z.enum(["mos_ru", "brainmaster"]).optional(),
  );
}

function optionalPercent() {
  return z.preprocess((v) => parseSheetPercent(v), z.number().min(0).max(100).optional());
}

function optionalTrimmedText() {
  return z.preprocess((v) => normalizeSheetText(v), z.string().optional());
}

function normalizeLegacyProgramName(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  const h1 = normalizeSheetText(out.program_name_h1);
  const h2 = normalizeSheetText(out.program_name_h2);
  if (!h2) {
    const legacy =
      normalizeSheetText(out.program_name) ??
      normalizeSheetText(out.program_filter_label);
    if (legacy) {
      const split = splitProgramName(legacy);
      if (!h1 && split.program_name_h1) out.program_name_h1 = split.program_name_h1;
      if (!h2 && split.program_name_h2) out.program_name_h2 = split.program_name_h2;
    }
  }
  return out;
}

const sheetGroupFields = z.object({
  shift_group_id: z.preprocess((v) => normalizeSheetText(v), z.string().min(1)),
  program_name_h1: z.preprocess(
    (v) => normalizeSheetText(v) ?? "",
    z.string().default(""),
  ),
  program_name_h2: z.preprocess((v) => normalizeSheetText(v), z.string().min(1)),
  quest_slug: z.preprocess((v) => normalizeSheetText(v), z.string().min(1)),
  venue_slug: z.preprocess((v) => normalizeSheetText(v), z.string().min(1)),
  start_date: requiredParsedDate("start_date"),
  end_date: requiredParsedDate("end_date"),
  school_name: z.preprocess(
    (v) => normalizeSheetText(v) ?? "",
    z.string().default(""),
  ),
  address: z.preprocess((v) => normalizeSheetText(v), z.string().min(1)),
  status: z.preprocess((v) => normalizeSheetText(v), z.string().min(1)),
  metro_station: optionalTrimmedText(),
  teacher: optionalTrimmedText(),
  max_capacity: optionalIntPositive(),
  notes: optionalTrimmedText(),
  description: optionalTrimmedText(),
  tags: optionalTrimmedText(),
  is_archived: optionalBool(),
  allow_waitlist_when_sold_out: optionalBool(),
});

/** Строка листа «Группы». */
export const sheetGroupRowSchema = z.preprocess(
  (v) => (v && typeof v === "object" ? normalizeLegacyProgramName(v as Record<string, unknown>) : v),
  sheetGroupFields,
);

export type SheetGroupRow = z.infer<typeof sheetGroupFields>;

/** Строка листа «Форматы». */
export const sheetFormatRowSchema = z.object({
  shift_group_id: z.preprocess((v) => normalizeSheetText(v), z.string().min(1)),
  start_time: requiredParsedTime("start_time"),
  end_time: requiredParsedTime("end_time"),
  price: requiredPrice(),
  format_type: optionalTrimmedText(),
  format_note: optionalTrimmedText(),
  enrolled: optionalIntNonneg(),
  mos_ru_code: z.preprocess((v) => parseSheetMosRuCode(v), z.string().optional()),
  mos_ru_link: z.preprocess((v) => parseSheetUrl(v), z.string().optional()),
  age_group: optionalTrimmedText(),
  registration_channel: optionalRegistrationChannel(),
  allow_preliminary_registration: optionalBool(),
});

export type SheetFormatRow = z.infer<typeof sheetFormatRowSchema>;

const sheetRowFields = sheetGroupFields.merge(sheetFormatRowSchema).extend({
  hero_image_url: z.preprocess((v) => parseSheetUrl(v), z.string().optional()),
  compact_image_url: z.preprocess((v) => parseSheetUrl(v), z.string().optional()),
  fallback_image_url: z.preprocess((v) => parseSheetUrl(v), z.string().optional()),
  image_alt: optionalTrimmedText(),
  image_focal_x: optionalPercent(),
  image_focal_y: optionalPercent(),
});

/** Объединённая строка после join группы + формата (для map-rows-to-offers). */
export const sheetRowSchema = z.preprocess(
  (v) => (v && typeof v === "object" ? normalizeLegacyProgramName(v as Record<string, unknown>) : v),
  sheetRowFields,
);

export type SheetRow = z.infer<typeof sheetRowFields>;

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
