import { venueOfferSchema, type VenueOffer } from "@/lib/schemas";

import { resolveQuestSlug } from "./quest-slug";
import type { SheetRow } from "./sheet-contract";

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

export type MappedOffer = VenueOffer & { _questSlug: string };

export function mapSheetRowToVenueOffer(
  row: SheetRow,
  venueSlugs: Set<string>,
): { ok: MappedOffer } | { error: string } {
  const questSlug = resolveQuestSlug(row.program_name, row.quest_slug ?? null);
  if (!questSlug) {
    return {
      error: `Не удалось сопоставить program_name с квестом: «${row.program_name}» (добавьте колонку quest_slug или расширьте lib/offers/quest-slug.ts).`,
    };
  }

  if (!venueSlugs.has(row.venue_slug)) {
    return {
      error: `Неизвестный venue_slug «${row.venue_slug}» — добавьте venues/${row.venue_slug}.yaml`,
    };
  }

  const id = `sheet:${questSlug}:${row.venue_slug}:${row.start_date}:${row.end_date}:${row.start_time}`;

  const shiftLabel = `${row.program_name} · ${row.school_name}`;
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
  };

  const parsed = venueOfferSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const offer: MappedOffer = { ...parsed.data, _questSlug: questSlug };
  return { ok: offer };
}

export function groupOffersByQuest(
  mapped: MappedOffer[],
): Record<string, VenueOffer[]> {
  const out: Record<string, VenueOffer[]> = {};
  for (const row of mapped) {
    const { _questSlug, ...offer } = row;
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
