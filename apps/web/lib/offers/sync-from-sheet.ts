import "server-only";

import { loadVenues } from "@/lib/content/load";

import { fetchSheetValuesGrid } from "./fetch-sheet-values";
import {
  collectDuplicateIds,
  groupOffersByQuest,
  mapSheetRowToVenueOffer,
  type MappedOffer,
} from "./map-rows-to-offers";
import { sheetRowSchema, validateHeaderRow } from "./sheet-contract";
import { writeOffersSnapshotAtomic } from "./snapshot-io";
import type { OffersSnapshotV1 } from "./snapshot-types";
import { sendTelegramAlert } from "./telegram";
import { venueSlugFromSchoolName } from "./venue-from-school";

function rowObject(
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

function isBlankRow(cells: string[]): boolean {
  return cells.every((c) => !String(c).trim());
}

export type SyncOffersResult = {
  ok: true;
  rowCount: number;
  questKeys: string[];
  generatedAt: string;
};

/**
 * Полный пайплайн: Google → парсинг → zod по строкам → целостность → атомарная запись.
 * При любой ошибке: Telegram (если настроен), снимок не меняется, кидается Error.
 */
export async function syncOffersFromGoogleSheet(): Promise<SyncOffersResult> {
  let grid: string[][];
  try {
    grid = await fetchSheetValuesGrid();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sendTelegramAlert(`[QuestHub sync-offers] Ошибка загрузки листа\n${msg}`);
    throw e;
  }
  const headerCells = grid[0].map((c) => String(c));
  const headerCheck = validateHeaderRow(headerCells);
  if (!headerCheck.ok) {
    const msg = `[QuestHub sync-offers] Провал заголовков\n${headerCheck.message}`;
    await sendTelegramAlert(msg);
    throw new Error(headerCheck.message);
  }
  const headers = headerCheck.normalized;

  const rowErrors: string[] = [];
  const mapped: MappedOffer[] = [];
  const venues = await loadVenues();
  const venueSlugs = new Set(venues.map((v) => v.slug));

  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r].map((c) => String(c));
    if (isBlankRow(cells)) continue;

    const obj = rowObject(headers, cells);

    // Частые «служебные» строки внизу/середине листа: даты есть, но цена 0 и нет данных площадки/программы.
    const priceRaw = String(obj.price ?? "").trim();
    if (priceRaw === "0") continue;

    // Полностью пустые / мусорные строки (даже если CSV/лист тянет лишнюю "тысячную" строку).
    const isMostlyEmpty =
      !String(obj.school_name ?? "").trim() &&
      !String(obj.program_name ?? "").trim() &&
      !String(obj.start_date ?? "").trim() &&
      !String(obj.end_date ?? "").trim() &&
      !String(obj.start_time ?? "").trim() &&
      !String(obj.end_time ?? "").trim() &&
      !String(obj.address ?? "").trim() &&
      !String(obj.status ?? "").trim();
    if (isMostlyEmpty) continue;

    // Если колонка venue_slug отсутствует в листе — выводим её из school_name.
    if (!obj.venue_slug || !String(obj.venue_slug).trim()) {
      const schoolName = String(obj.school_name ?? "").trim();
      const derived = venueSlugFromSchoolName(schoolName);
      if (derived) obj.venue_slug = derived;
    }

    const parsed = sheetRowSchema.safeParse(obj);
    if (!parsed.success) {
      rowErrors.push(
        `Строка ${r + 1} (1-based в листе): ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
      continue;
    }

    const m = mapSheetRowToVenueOffer(parsed.data, venueSlugs);
    if ("error" in m) {
      rowErrors.push(`Строка ${r + 1}: ${m.error}`);
      continue;
    }
    mapped.push(m.ok);
  }

  if (rowErrors.length > 0) {
    const sample = rowErrors.slice(0, 25).join("\n");
    const more =
      rowErrors.length > 25 ? `\n… и ещё ${rowErrors.length - 25} ошибок` : "";
    const msg = `[QuestHub sync-offers] Валидация строк (${rowErrors.length})\n${sample}${more}`;
    await sendTelegramAlert(msg);
    const clientMsg =
      rowErrors.length > 0
        ? `Ошибки в строках таблицы (${rowErrors.length}):\n${rowErrors.slice(0, 5).join("\n")}${rowErrors.length > 5 ? "\n… (см. Telegram/логи)" : ""}`
        : `Ошибки в строках таблицы: ${rowErrors.length}`;
    throw new Error(clientMsg);
  }

  if (mapped.length === 0) {
    const msg =
      "[QuestHub sync-offers] После парсинга не осталось ни одной строки смены (проверьте диапазон и фильтры пустых строк).";
    await sendTelegramAlert(msg);
    throw new Error("Нет валидных строк смен в таблице");
  }

  const dupes = collectDuplicateIds(mapped);
  if (dupes.length > 0) {
    const msg = `[QuestHub sync-offers] Дубликаты id офферов:\n${dupes.join("\n")}`;
    await sendTelegramAlert(msg);
    throw new Error("Дубликаты id офферов после маппинга");
  }

  const offersByQuest = groupOffersByQuest(mapped);
  const snapshot: OffersSnapshotV1 = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "google_sheet",
    offersByQuest,
  };

  await writeOffersSnapshotAtomic(snapshot);

  return {
    ok: true,
    rowCount: mapped.length,
    questKeys: Object.keys(offersByQuest),
    generatedAt: snapshot.generatedAt,
  };
}
