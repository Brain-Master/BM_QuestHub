/**
 * Normalizes raw Google Sheets cell values before Zod validation.
 */

const NBSP = /\u00a0|\u202f/g;
const CURRENCY_RE = /[₽руб]/gi;

function stripCellQuotes(raw: string): string {
  let s = raw.trim();
  while (
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith('"') && s.endsWith('"'))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("'")) s = s.slice(1).trim();
  return s;
}

export function normalizeSheetText(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = stripCellQuotes(String(raw))
    .normalize("NFC")
    .replace(NBSP, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s || undefined;
}

function parseDecimalPart(fraction: string): number {
  const digits = fraction.replace(/\D/g, "");
  if (!digits) return 0;
  const n = Number(digits);
  if (fraction.length <= 2) return n / 100;
  return n;
}

/**
 * Parses RUB amounts from Sheets locales: 8500, '8500, 8 500, 14'000,00, 8 500 ₽.
 */
export function parseSheetPrice(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw < 0 ? undefined : Math.round(raw);
  }

  const s = stripCellQuotes(String(raw))
    .replace(NBSP, " ")
    .replace(CURRENCY_RE, "")
    .trim();
  if (!s) return undefined;

  const noSpaces = s.replace(/[\s'’]/g, "");
  if (/^\d+\.\d{1,2}$/.test(noSpaces)) {
    return Number(noSpaces.split(".")[0]);
  }

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let main = s;
  let fraction = "";

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      main = s.slice(0, lastComma);
      fraction = s.slice(lastComma + 1);
    } else {
      main = s.slice(0, lastDot);
      fraction = s.slice(lastDot + 1);
    }
  } else if (lastComma >= 0) {
    const after = s.slice(lastComma + 1);
    if (/^\d{1,2}$/.test(after)) {
      main = s.slice(0, lastComma);
      fraction = after;
    }
  }

  const digits = main.replace(/[^\d]/g, "");
  if (!digits) return undefined;

  let value = Number(digits);
  if (fraction) {
    const frac = parseDecimalPart(fraction);
    value = Math.round(value + frac);
  }

  if (!Number.isFinite(value) || value < 0) return undefined;
  return value;
}

export function parseSheetNonNegativeInt(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(raw);
    return n >= 0 ? n : undefined;
  }
  const price = parseSheetPrice(raw);
  return price;
}

export function parseSheetPositiveInt(raw: unknown): number | undefined {
  const n = parseSheetNonNegativeInt(raw);
  if (n === undefined || n <= 0) return undefined;
  return n;
}

/**
 * Headcount from Hot Sheet. Values far above capacity are usually CRM/mos IDs
 * pasted into the enrolled column by mistake.
 */
export function normalizeEnrolledHeadcount(
  enrolled: number | undefined,
  maxCapacity?: number,
): number | undefined {
  if (typeof enrolled !== "number" || !Number.isFinite(enrolled) || enrolled < 0) {
    return undefined;
  }
  const cap =
    typeof maxCapacity === "number" && maxCapacity > 0 ? maxCapacity : 200;
  const ceiling = Math.max(cap * 5, 500);
  if (enrolled > ceiling) return undefined;
  return Math.round(enrolled);
}

/** Sum per-format enrollments; identical values are one group total, not N×duplicate. */
export function aggregateVariantEnrolled(
  variants: readonly { enrolled?: number }[],
  maxCapacity?: number,
): number | undefined {
  const values = variants
    .map((v) => normalizeEnrolledHeadcount(v.enrolled, maxCapacity))
    .filter((n): n is number => typeof n === "number");
  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0];
  const first = values[0];
  if (values.every((n) => n === first)) return first;
  return values.reduce((a, b) => a + b, 0);
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const RU_DATE_RE = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/;

export function parseSheetDate(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + raw * 86_400_000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const s = normalizeSheetText(raw);
  if (!s) return undefined;

  const iso = s.match(ISO_DATE_RE);
  if (iso) return s;

  const ru = s.match(RU_DATE_RE);
  if (ru) {
    const [, d, m, y] = ru;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return undefined;
}

const TIME_RE = /^(\d{1,2})[:.](\d{2})$/;

export function parseSheetTime(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const totalMinutes = Math.round(raw * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h}:${String(m).padStart(2, "0")}`;
  }

  const s = normalizeSheetText(raw)?.replace(/\s/g, "");
  if (!s) return undefined;

  const m = s.match(TIME_RE);
  if (!m) return undefined;

  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return undefined;
  return `${h}:${String(min).padStart(2, "0")}`;
}

export function parseSheetBool(raw: unknown): boolean | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "boolean") return raw;
  const t = normalizeSheetText(raw)?.toLowerCase();
  if (!t) return undefined;
  if (["1", "true", "yes", "y", "да", "истина", "+"].includes(t)) return true;
  if (["0", "false", "no", "n", "нет", "ложь", "-"].includes(t)) return false;
  return undefined;
}

export function parseSheetRegistrationChannel(
  raw: unknown,
): "mos_ru" | "brainmaster" | undefined {
  const t = normalizeSheetText(raw)?.toLowerCase();
  if (!t) return undefined;
  if (["mos", "mos.ru", "mos_ru", "mosru", "моссру", "мосру"].includes(t)) {
    return "mos_ru";
  }
  if (["brainmaster", "bm", "direct", "direct_bm", "напрямую"].includes(t)) {
    return "brainmaster";
  }
  return undefined;
}

export function parseSheetMosRuCode(raw: unknown): string | undefined {
  const s = normalizeSheetText(raw);
  if (!s) return undefined;
  const digits = s.replace(/\D/g, "");
  return digits || undefined;
}

export function parseSheetUrl(raw: unknown): string | undefined {
  const s = normalizeSheetText(raw);
  if (!s) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function parseSheetPercent(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw >= 0 && raw <= 100 ? raw : undefined;
  }
  const s = normalizeSheetText(raw)?.replace("%", "");
  if (!s) return undefined;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : undefined;
}

export function parseSheetTeachers(raw: unknown): string[] {
  const s = normalizeSheetText(raw);
  if (!s) return [];
  return s
    .split(/[;|]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function buildShiftGroupId(row: {
  shift_group_id?: string;
  quest_slug: string;
  venue_slug: string;
  start_date: string;
  end_date: string;
}): string {
  const explicit = normalizeSheetText(row.shift_group_id);
  if (explicit) return explicit;
  return `${row.quest_slug.trim()}:${row.venue_slug.trim()}:${row.start_date}:${row.end_date}`;
}

export function compareTimes(a: string, b: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(a) - toMin(b);
}

export function formatVariantTimeLabel(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
): string {
  const days = compactDateSpanDays(startDate, endDate);
  const dayPrefix =
    days >= 8
      ? "Пн-Пт"
      : days === 4
        ? "Пн-Чт"
        : startDate === endDate
          ? ""
          : "Пн-Пт";
  const range = `${startTime} – ${endTime}`;
  return dayPrefix ? `${dayPrefix}, ${range}` : range;
}

function compactDateSpanDays(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  return Math.max(1, Math.round((endMs - startMs) / 86_400_000) + 1);
}

export function isZeroPrice(raw: unknown): boolean {
  const p = parseSheetPrice(raw);
  return p === 0;
}
