import { z } from "zod";

/** Обязательные заголовки (после нормализации в snake_case). */
export const REQUIRED_SHEET_HEADERS = [
  "program_name",
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

/** Одна строка листа после склейки с заголовками. */
export const sheetRowSchema = z.object({
  venue_slug: z.string().min(1),
  quest_slug: z
    .preprocess(
      (v) =>
        v === undefined || v === null || (typeof v === "string" && !v.trim())
          ? undefined
          : v,
      z.string().min(1).optional(),
    ),
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
