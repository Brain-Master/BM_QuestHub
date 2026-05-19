import { fetchSheetValuesGrid } from "@/lib/google/fetch-sheet-grid";
import { hotSheetConfig } from "@/lib/google/sheet-env";

import {
  collectDuplicateIds,
  consolidateOffersByShiftGroup,
  groupOffersByQuest,
  mapSheetRowToVenueOffer,
  type MappedOffer,
} from "./map-rows-to-offers";
import { isZeroPrice } from "./sheet-field-parsers";
import {
  FORMAT_REQUIRED_HEADERS,
  GROUP_REQUIRED_HEADERS,
  sheetFormatRowSchema,
  sheetGroupRowSchema,
  sheetRowSchema,
  validateHeaderRow,
} from "./sheet-contract";
import {
  isBlankRow,
  mergeGroupAndFormat,
  rowObjectFromCells,
} from "./sheet-hot-join";
import type { OffersSnapshotV1 } from "./snapshot-types";

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

function parseGrid(
  grid: string[][],
  sheetLabel: string,
  requiredHeaders: readonly string[],
):
  | { ok: true; headers: string[]; rows: Record<string, string>[] }
  | { ok: false; message: string } {
  if (grid.length === 0) {
    return { ok: false, message: `Лист «${sheetLabel}» пуст` };
  }
  const headerCells = grid[0].map((c) => String(c));
  const headerCheck = validateHeaderRow(headerCells, requiredHeaders);
  if (!headerCheck.ok) {
    return {
      ok: false,
      message: `«${sheetLabel}»: ${headerCheck.message}`,
    };
  }
  const headers = headerCheck.normalized;
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r].map((c) => String(c));
    if (isBlankRow(cells)) continue;
    rows.push(rowObjectFromCells(headers, cells));
  }
  return { ok: true, headers, rows };
}

/**
 * Google hot spreadsheet (листы «Группы» + «Форматы») → validated offers snapshot.
 */
export async function syncHotOffersFromGoogleSheet(
  options: SyncHotOptions,
): Promise<SyncHotResult> {
  const alert = options.onAlert ?? (async () => {});

  const { spreadsheetId, ranges } = hotSheetConfig();
  let groupsGrid: string[][];
  let formatsGrid: string[][];
  try {
    [groupsGrid, formatsGrid] = await Promise.all([
      fetchSheetValuesGrid({ spreadsheetId, range: ranges.groups }),
      fetchSheetValuesGrid({ spreadsheetId, range: ranges.formats }),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await alert(`[QuestHub sync-offers] Ошибка загрузки листов\n${msg}`);
    throw e;
  }

  const groupsParsed = parseGrid(groupsGrid, "Группы", GROUP_REQUIRED_HEADERS);
  if (!groupsParsed.ok) {
    await alert(`[QuestHub sync-offers] ${groupsParsed.message}`);
    throw new Error(groupsParsed.message);
  }

  const formatsParsed = parseGrid(formatsGrid, "Форматы", FORMAT_REQUIRED_HEADERS);
  if (!formatsParsed.ok) {
    await alert(`[QuestHub sync-offers] ${formatsParsed.message}`);
    throw new Error(formatsParsed.message);
  }

  const rowErrors: string[] = [];
  const groupById = new Map<string, Record<string, string>>();

  for (let i = 0; i < groupsParsed.rows.length; i++) {
    const raw = groupsParsed.rows[i];
    const sheetRow = i + 2;
    const parsed = sheetGroupRowSchema.safeParse(raw);
    if (!parsed.success) {
      rowErrors.push(
        `Группы, строка ${sheetRow}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
      continue;
    }
    const id = parsed.data.shift_group_id.trim();
    if (groupById.has(id)) {
      rowErrors.push(
        `Группы, строка ${sheetRow}: дубликат shift_group_id «${id}»`,
      );
      continue;
    }
    groupById.set(id, raw);
  }

  const mapped: MappedOffer[] = [];
  const venueSlugs = options.venueSlugs;
  const questSlugs = options.questSlugs;

  for (let i = 0; i < formatsParsed.rows.length; i++) {
    const raw = formatsParsed.rows[i];
    const sheetRow = i + 2;
    const formatParsed = sheetFormatRowSchema.safeParse(raw);
    if (!formatParsed.success) {
      rowErrors.push(
        `Форматы, строка ${sheetRow}: ${formatParsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
      continue;
    }

    const groupId = formatParsed.data.shift_group_id.trim();
    const group = groupById.get(groupId);
    if (!group) {
      rowErrors.push(
        `Форматы, строка ${sheetRow}: нет группы с shift_group_id «${groupId}» на листе «Группы»`,
      );
      continue;
    }

    const merged = mergeGroupAndFormat(group, raw);
    if (isZeroPrice(merged.price)) continue;

    const rowParsed = sheetRowSchema.safeParse(merged);
    if (!rowParsed.success) {
      rowErrors.push(
        `Форматы, строка ${sheetRow}: ${rowParsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
      continue;
    }

    if (questSlugs && !questSlugs.has(rowParsed.data.quest_slug.trim())) {
      rowErrors.push(
        `Форматы, строка ${sheetRow}: quest_slug «${rowParsed.data.quest_slug}» не найден в каталоге`,
      );
      continue;
    }

    const m = mapSheetRowToVenueOffer(rowParsed.data, venueSlugs);
    if ("error" in m) {
      rowErrors.push(`Форматы, строка ${sheetRow}: ${m.error}`);
      continue;
    }
    mapped.push(m.ok);
  }

  if (rowErrors.length > 0) {
    const sample = rowErrors.slice(0, 25).join("\n");
    const more =
      rowErrors.length > 25 ? `\n… и ещё ${rowErrors.length - 25} ошибок` : "";
    await alert(
      `[QuestHub sync-offers] Валидация (${rowErrors.length})\n${sample}${more}`,
    );
    throw new Error(
      `Ошибки в таблице (${rowErrors.length}):\n${rowErrors.slice(0, 5).join("\n")}`,
    );
  }

  if (mapped.length === 0) {
    const msg =
      "[QuestHub sync-offers] После парсинга не осталось ни одной строки смены.";
    await alert(msg);
    throw new Error("Нет валидных строк форматов в таблице");
  }

  const consolidated = consolidateOffersByShiftGroup(mapped);

  const dupes = collectDuplicateIds(consolidated);
  if (dupes.length > 0) {
    await alert(
      `[QuestHub sync-offers] Дубликаты id офферов:\n${dupes.join("\n")}`,
    );
    throw new Error("Дубликаты id офферов после маппинга");
  }

  const offersByQuest = groupOffersByQuest(consolidated);
  const snapshot: OffersSnapshotV1 = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "google_sheet",
    offersByQuest,
  };

  return {
    ok: true,
    rowCount: consolidated.length,
    questKeys: Object.keys(offersByQuest),
    generatedAt: snapshot.generatedAt,
    snapshot,
  };
}
