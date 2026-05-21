import {
  type RegistrationChannel,
  venueOfferSchema,
  type ScheduleCard,
  type ScheduleVariant,
  type VenueOffer,
} from "@/lib/schemas";

import type { SheetRow } from "./sheet-contract";
import {
  buildShiftGroupId,
  compareTimes,
  formatVariantTimeLabel,
  parseSheetTeachers,
} from "./sheet-field-parsers";
import { joinProgramName } from "./program-name";

function formatRuDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  };
  return `${fmt(start)} — ${fmt(end)}`;
}

function formatPriceLabel(price: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;
}

function parseMosUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function splitTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[;,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function compactDateSpanDays(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  return Math.max(1, Math.round((endMs - startMs) / 86_400_000) + 1);
}

function inferFormatType(row: SheetRow): string {
  const notes = row.notes?.toLowerCase() ?? "";
  const days = compactDateSpanDays(row.start_date, row.end_date);

  if (notes.includes("марафон") || days >= 8) return "Марафон (2 недели)";
  if (notes.includes("полный день")) {
    return days === 4 ? "Полный день (4 дня)" : "Полный день";
  }
  return days === 4 ? "Интенсив (4 дня)" : "Интенсив (полдня)";
}

function inferLocationNote(row: SheetRow): string | undefined {
  const note = row.notes?.match(/(?:корпус|шо-\d+)[^.\n]*/i)?.[0]?.trim();
  return note || undefined;
}

function inferRegistrationChannel(
  row: SheetRow,
  mosBookingUrl: string | null,
): RegistrationChannel {
  return row.registration_channel ?? (mosBookingUrl ? "mos_ru" : "brainmaster");
}

function inferAllowPreliminaryRegistration(row: SheetRow): boolean {
  if (typeof row.allow_preliminary_registration === "boolean") {
    return row.allow_preliminary_registration;
  }

  const status = row.status.trim().toLowerCase();
  return (
    status === "планируется" ||
    status === "согласование" ||
    (status === "мест нет" && row.allow_waitlist_when_sold_out === true)
  );
}

function slugifyFormatKey(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "format";
}

function buildVariantId(row: SheetRow, formatType: string): string {
  return `${row.venue_slug}:${row.start_date}:${slugifyFormatKey(formatType)}`;
}

function buildVariantFromRow(row: SheetRow, formatType: string): ScheduleVariant {
  const formatNote = row.format_note?.trim() || undefined;
  const priceLabel = formatPriceLabel(row.price);
  const mosBookingUrl = parseMosUrl(row.mos_ru_link);

  return {
    id: buildVariantId(row, formatType),
    type: formatType,
    time: formatVariantTimeLabel(
      row.start_date,
      row.end_date,
      row.start_time,
      row.end_time,
    ),
    priceLabel,
    note: formatNote ?? null,
    ageLabel: row.age_group?.trim() || undefined,
    mosRuCode: row.mos_ru_code?.trim() || undefined,
    mosBookingUrl: mosBookingUrl ?? undefined,
    enrolled: row.enrolled,
    registrationChannel: inferRegistrationChannel(row, mosBookingUrl),
    allowPreliminaryRegistration: inferAllowPreliminaryRegistration(row),
  };
}

function buildScheduleCard(row: SheetRow): ScheduleCard {
  const programFull = joinProgramName(row.program_name_h1, row.program_name_h2);
  const formatType = row.format_type?.trim() || inferFormatType(row);
  const variant = buildVariantFromRow(row, formatType);
  const mosBookingUrl = parseMosUrl(row.mos_ru_link);
  const teachers = parseSheetTeachers(row.teacher);
  const teacherName = teachers.length > 0 ? teachers.join("; ") : undefined;

  return {
    displayTitle: programFull,
    description: row.description?.trim() || undefined,
    teacherName,
    tags: splitTags(row.tags),
    timelineDate: undefined,
    shortDate: undefined,
    shiftNumber: undefined,
    locationNote: inferLocationNote(row),
    programNameH1: row.program_name_h1?.trim() || undefined,
    programNameH2: row.program_name_h2.trim(),
    programFilterLabel: programFull,
    ageLabel: row.age_group?.trim() || undefined,
    formatType,
    formatTime: variant.time,
    formatNote: row.format_note?.trim() || row.notes?.trim() || undefined,
    mosRuCode: row.mos_ru_code?.trim() || undefined,
    status: row.status,
    isArchived: row.is_archived ?? false,
    allowWaitlistWhenSoldOut: row.allow_waitlist_when_sold_out ?? false,
    registrationChannel: variant.registrationChannel,
    allowPreliminaryRegistration: variant.allowPreliminaryRegistration ?? false,
    variants: [variant],
  };
}

export type MappedOffer = VenueOffer & {
  _questSlug: string;
  _shiftGroupId: string;
};

export function mapSheetRowToVenueOffer(
  row: SheetRow,
  venueSlugs: Set<string>,
): { ok: MappedOffer } | { error: string } {
  const questSlug = row.quest_slug.trim();

  if (!venueSlugs.has(row.venue_slug)) {
    return {
      error: `Неизвестный venue_slug «${row.venue_slug}» — добавьте venues/${row.venue_slug}.yaml`,
    };
  }

  const shiftGroupId = buildShiftGroupId(row);
  const id = `sheet:${shiftGroupId}`;

  const shiftLabel = `${joinProgramName(row.program_name_h1, row.program_name_h2)} · ${row.school_name}`;
  const dateRange = formatRuDateRange(row.start_date, row.end_date);
  const daySchedule = `Ежедневно: ${row.start_time}–${row.end_time}`;
  const priceLabel = formatPriceLabel(row.price);
  const mosBookingUrl = parseMosUrl(row.mos_ru_link);

  const parts: string[] = [];
  if (row.notes?.trim()) parts.push(row.notes.trim());
  if (row.age_group?.trim()) parts.push(`Возраст: ${row.age_group.trim()}`);
  if (row.mos_ru_code?.trim())
    parts.push(`Код карточки mos.ru: ${row.mos_ru_code.trim()}`);
  const includedNote = parts.length > 0 ? parts.join("\n\n") : undefined;

  const draft: VenueOffer = {
    id,
    venueSlug: row.venue_slug,
    shiftLabel,
    startDate: row.start_date,
    endDate: row.end_date,
    startTime: row.start_time,
    endTime: row.end_time,
    dateRange,
    daySchedule,
    priceLabel,
    mosBookingUrl,
    includedNote,
    sheetStatus: row.status,
    enrolled: row.enrolled,
    maxCapacity: row.max_capacity,
    scheduleCard: buildScheduleCard(row),
  };

  const parsed = venueOfferSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const offer: MappedOffer = {
    ...parsed.data,
    _questSlug: questSlug,
    _shiftGroupId: shiftGroupId,
  };
  return { ok: offer };
}

function mergeScheduleVariants(
  offers: MappedOffer[],
): NonNullable<ScheduleCard["variants"]> {
  const out: NonNullable<ScheduleCard["variants"]> = [];
  const seen = new Set<string>();

  for (const offer of offers) {
    for (const variant of offer.scheduleCard?.variants ?? []) {
      const key = variant.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(variant);
    }
  }

  return out;
}

function norm(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function validateShiftGroupConsistency(
  shiftGroupId: string,
  offers: MappedOffer[],
): string | null {
  const [primary, ...rest] = offers;
  const checks: Array<{ label: string; value: string }> = [
    { label: "quest_slug", value: primary._questSlug },
    { label: "venue_slug", value: primary.venueSlug },
    { label: "start_date", value: primary.startDate },
    { label: "end_date", value: primary.endDate },
    { label: "status", value: norm(primary.sheetStatus) },
    {
      label: "max_capacity",
      value:
        primary.maxCapacity === undefined ? "" : String(primary.maxCapacity),
    },
    {
      label: "program_name_h1",
      value: norm(primary.scheduleCard?.programNameH1),
    },
    {
      label: "program_name_h2",
      value: norm(primary.scheduleCard?.programNameH2),
    },
    {
      label: "age_group",
      value: norm(primary.scheduleCard?.ageLabel),
    },
  ];

  const conflicts: string[] = [];
  for (const other of rest) {
    const otherChecks: Record<string, string> = {
      quest_slug: other._questSlug,
      venue_slug: other.venueSlug,
      start_date: other.startDate,
      end_date: other.endDate,
      status: norm(other.sheetStatus),
      max_capacity:
        other.maxCapacity === undefined ? "" : String(other.maxCapacity),
      program_name_h1: norm(other.scheduleCard?.programNameH1),
      program_name_h2: norm(other.scheduleCard?.programNameH2),
      age_group: norm(other.scheduleCard?.ageLabel),
    };
    for (const { label, value } of checks) {
      if (otherChecks[label] !== value) {
        conflicts.push(
          `${shiftGroupId}: «${label}» — «${value}» vs «${otherChecks[label]}»`,
        );
      }
    }
  }

  return conflicts.length > 0 ? conflicts.join("\n") : null;
}

function computeGroupTimeSpan(offers: MappedOffer[]): {
  startTime: string;
  endTime: string;
} {
  let startTime = offers[0].startTime;
  let endTime = offers[0].endTime;
  for (const offer of offers.slice(1)) {
    if (compareTimes(offer.startTime, startTime) < 0) startTime = offer.startTime;
    if (compareTimes(offer.endTime, endTime) > 0) endTime = offer.endTime;
  }
  return { startTime, endTime };
}

function sumVariantEnrolled(variants: ScheduleVariant[]): number | undefined {
  const values = variants
    .map((v) => v.enrolled)
    .filter((n): n is number => typeof n === "number");
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0);
}

function mergeShiftGroupOffers(offers: MappedOffer[]): MappedOffer {
  const [primary] = offers;
  const variants = mergeScheduleVariants(offers);
  const { startTime, endTime } = computeGroupTimeSpan(offers);
  const card = primary.scheduleCard;
  const enrolled = sumVariantEnrolled(variants);

  const mergedCard: ScheduleCard | undefined = card
    ? {
        ...card,
        variants,
        formatType: card.formatType ?? variants[0]?.type,
        formatNote: card.formatNote ?? variants[0]?.note ?? undefined,
        registrationChannel:
          variants[0]?.registrationChannel ?? card.registrationChannel,
        allowPreliminaryRegistration:
          variants[0]?.allowPreliminaryRegistration ??
          card.allowPreliminaryRegistration,
      }
    : undefined;

  const mosBookingUrl =
    primary.mosBookingUrl ??
    offers.find((o) => o.mosBookingUrl)?.mosBookingUrl ??
    null;

  return {
    ...primary,
    startTime,
    endTime,
    daySchedule: `Ежедневно: ${startTime}–${endTime}`,
    mosBookingUrl,
    enrolled,
    priceLabel: primary.priceLabel ?? variants[0]?.priceLabel ?? "",
    scheduleCard: mergedCard,
  };
}

/** Несколько строк Hot Sheet с одним shift_group_id → один offer с variants[]. */
export function consolidateOffersByShiftGroup(
  mapped: MappedOffer[],
): MappedOffer[] {
  const groups = new Map<string, MappedOffer[]>();
  for (const row of mapped) {
    const key = row._shiftGroupId;
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  const consolidated: MappedOffer[] = [];
  for (const [shiftGroupId, offers] of groups) {
    const conflict = validateShiftGroupConsistency(shiftGroupId, offers);
    if (conflict) {
      throw new Error(
        `Несовпадение полей группы смены:\n${conflict}`,
      );
    }

    if (offers.length === 1) {
      const single = offers[0];
      const variants = single.scheduleCard?.variants ?? [];
      consolidated.push({
        ...single,
        enrolled: sumVariantEnrolled(variants) ?? single.enrolled,
      });
      continue;
    }

    consolidated.push(mergeShiftGroupOffers(offers));
  }

  return consolidated;
}

export function groupOffersByQuest(
  mapped: MappedOffer[],
): Record<string, VenueOffer[]> {
  const out: Record<string, VenueOffer[]> = {};
  for (const row of mapped) {
    const { _questSlug, _shiftGroupId: _, ...offer } = row;
    if (!out[_questSlug]) out[_questSlug] = [];
    out[_questSlug].push(offer);
  }
  return out;
}

export function collectDuplicateIds(mapped: MappedOffer[]): string[] {
  const seen = new Map<string, number>();
  const dupes: string[] = [];
  for (const m of mapped) {
    const n = (seen.get(m.id) ?? 0) + 1;
    seen.set(m.id, n);
    if (n === 2) dupes.push(m.id);
  }
  return dupes;
}
