import { fetchSheetValuesGrid } from "@/lib/google/fetch-sheet-grid";
import { hotSheetConfig } from "@/lib/google/sheet-env";

import {
  collectDuplicateIds,
  groupOffersByQuest,
  mapSheetRowToVenueOffer,
  type MappedOffer,
} from "./map-rows-to-offers";
import { sheetRowSchema, validateHeaderRow } from "./sheet-contract";
import type { OffersSnapshotV1 } from "./snapshot-types";

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

export type SyncHotResult = {
  ok: true;
  rowCount: number;
  questKeys: string[];
  generatedAt: string;
  snapshot: OffersSnapshotV1;
};

export type SyncHotOptions = {
  venueSlugs: Set<string>;
  questSlugs?: Set<string>;
  onAlert?: (message: string) => Promise<void>;
};

/**
 * Google hot sheet → validated offers snapshot (no file I/O).
 */
export async function syncHotOffersFromGoogleSheet(
  options: SyncHotOptions,
): Promise<SyncHotResult> {
  const alert = options.onAlert ?? (async () => {});

  const { spreadsheetId, range } = hotSheetConfig();
  let grid: string[][];
  try {
    grid = await fetchSheetValuesGrid({ spreadsheetId, range });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await alert(`[QuestHub sync-offers] Ошибка загрузки листа\n${msg}`);
    throw e;
  }

  const headerCells = grid[0].map((c) => String(c));
  const headerCheck = validateHeaderRow(headerCells);
  if (!headerCheck.ok) {
    const msg = `[QuestHub sync-offers] Провал заголовков\n${headerCheck.message}`;
    await alert(msg);
    throw new Error(headerCheck.message);
  }
  const headers = headerCheck.normalized;

  const rowErrors: string[] = [];
  const mapped: MappedOffer[] = [];
  const venueSlugs = options.venueSlugs;
  const questSlugs = options.questSlugs;

  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r].map((c) => String(c));
    if (isBlankRow(cells)) continue;

    const obj = rowObject(headers, cells);
    const priceRaw = String(obj.price ?? "").trim();
    if (priceRaw === "0") continue;

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

    const parsed = sheetRowSchema.safeParse(obj);
    if (!parsed.success) {
      rowErrors.push(
        `Строка ${r + 1}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
      continue;
    }

    if (questSlugs && !questSlugs.has(parsed.data.quest_slug.trim())) {
      rowErrors.push(
        `Строка ${r + 1}: quest_slug «${parsed.data.quest_slug}» не найден в каталоге`,
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
    await alert(
      `[QuestHub sync-offers] Валидация строк (${rowErrors.length})\n${sample}${more}`,
    );
    throw new Error(
      `Ошибки в строках таблицы (${rowErrors.length}):\n${rowErrors.slice(0, 5).join("\n")}`,
    );
  }

  if (mapped.length === 0) {
    const msg =
      "[QuestHub sync-offers] После парсинга не осталось ни одной строки смены.";
    await alert(msg);
    throw new Error("Нет валидных строк смен в таблице");
  }

  const dupes = collectDuplicateIds(mapped);
  if (dupes.length > 0) {
    await alert(
      `[QuestHub sync-offers] Дубликаты id офферов:\n${dupes.join("\n")}`,
    );
    throw new Error("Дубликаты id офферов после маппинга");
  }

  const offersByQuest = groupOffersByQuest(mapped);
  const snapshot: OffersSnapshotV1 = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "google_sheet",
    offersByQuest,
  };

  return {
    ok: true,
    rowCount: mapped.length,
    questKeys: Object.keys(offersByQuest),
    generatedAt: snapshot.generatedAt,
    snapshot,
  };
}
