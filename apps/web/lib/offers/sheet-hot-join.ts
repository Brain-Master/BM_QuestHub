import { buildShiftGroupId } from "./sheet-field-parsers";

/** Колонки листа «Группы». */
export const HOT_GROUP_FIELD_KEYS = [
  "shift_group_id",
  "program_name_h1",
  "program_name_h2",
  "quest_slug",
  "venue_slug",
  "start_date",
  "end_date",
  "school_name",
  "address",
  "status",
  "metro_station",
  "teacher",
  "max_capacity",
  "notes",
  "description",
  "tags",
  "is_archived",
  "allow_waitlist_when_sold_out",
] as const;

/** Колонки листа «Форматы». */
export const HOT_FORMAT_FIELD_KEYS = [
  "shift_group_id",
  "start_time",
  "end_time",
  "price",
  "format_type",
  "format_note",
  "enrolled",
  "mos_ru_code",
  "mos_ru_link",
  "age_group",
  "registration_channel",
  "allow_preliminary_registration",
] as const;

export function rowObjectFromCells(
  headers: string[],
  cells: string[],
): Record<string, string> {
  const o: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const key = headers[i];
    if (!key) continue;
    const raw = cells[i];
    o[key] = raw === undefined || raw === null ? "" : String(raw);
  }
  return o;
}

export function isBlankRow(cells: string[]): boolean {
  return cells.every((c) => !String(c).trim());
}

export function resolveShiftGroupId(obj: Record<string, string>): string {
  const explicit = String(obj.shift_group_id ?? "").trim();
  if (explicit) return explicit;
  return buildShiftGroupId({
    shift_group_id: "",
    quest_slug: obj.quest_slug ?? "",
    venue_slug: obj.venue_slug ?? "",
    start_date: obj.start_date ?? "",
    end_date: obj.end_date ?? "",
  });
}

/** Склеивает строку группы и строку формата в объект для sheetRowSchema. */
export function mergeGroupAndFormat(
  group: Record<string, string>,
  format: Record<string, string>,
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const key of HOT_GROUP_FIELD_KEYS) {
    if (group[key] !== undefined) merged[key] = group[key];
  }
  for (const key of HOT_FORMAT_FIELD_KEYS) {
    if (format[key] !== undefined) merged[key] = format[key];
  }
  return merged;
}
