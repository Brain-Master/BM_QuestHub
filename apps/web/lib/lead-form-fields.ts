const PERSON_NAME_MIN = 2;
const PERSON_NAME_MAX = 80;
const CHILD_AGE_MIN = 1;
const CHILD_AGE_MAX = 18;

const LETTER_RE = /[A-Za-zА-Яа-яЁё]/;

export function extractRuPhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.length > 0 && !digits.startsWith("7")) {
    digits = `7${digits}`;
  }
  return digits.slice(0, 11);
}

export function formatRuPhoneInput(raw: string): string {
  const digits = extractRuPhoneDigits(raw);
  if (digits.length === 0) return "";

  const local = digits.slice(1);
  let formatted = "+7";

  if (local.length > 0) {
    formatted += ` (${local.slice(0, 3)}`;
  }
  if (local.length >= 3) {
    formatted += `) ${local.slice(3, 6)}`;
  }
  if (local.length >= 6) {
    formatted += `-${local.slice(6, 8)}`;
  }
  if (local.length >= 8) {
    formatted += `-${local.slice(8, 10)}`;
  }

  return formatted;
}

export function normalizeRuPhone(raw: string): string | null {
  const digits = extractRuPhoneDigits(raw);
  if (digits.length !== 11 || !digits.startsWith("7")) return null;
  return `+${digits}`;
}

export function isValidRuPhone(raw: string): boolean {
  return normalizeRuPhone(raw) !== null;
}

export function normalizePersonName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isValidPersonName(raw: string): boolean {
  const normalized = normalizePersonName(raw);
  if (normalized.length < PERSON_NAME_MIN || normalized.length > PERSON_NAME_MAX) {
    return false;
  }
  if (!LETTER_RE.test(normalized)) return false;
  if (/^\d+$/.test(normalized.replace(/\s/g, ""))) return false;
  return true;
}

export function parseChildAgeYears(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;
  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function isValidChildAgeYears(value: number): boolean {
  return Number.isInteger(value) && value >= CHILD_AGE_MIN && value <= CHILD_AGE_MAX;
}

export function normalizeChildAge(raw: string): string | null {
  const years = parseChildAgeYears(raw);
  if (years === null || !isValidChildAgeYears(years)) return null;
  return String(years);
}
