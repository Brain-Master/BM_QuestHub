import { fetchSheetValuesGrid as fetchGrid } from "@/lib/google/fetch-sheet-grid";
import { hotSheetConfig } from "@/lib/google/sheet-env";

/**
 * Read hot schedule sheets (Группы + Форматы).
 */
export async function fetchHotSheetGrids(): Promise<{
  groups: string[][];
  formats: string[][];
}> {
  const { spreadsheetId, ranges } = hotSheetConfig();
  const [groups, formats] = await Promise.all([
    fetchGrid({ spreadsheetId, range: ranges.groups }),
    fetchGrid({ spreadsheetId, range: ranges.formats }),
  ]);
  return { groups, formats };
}

/** @deprecated use fetchHotSheetGrids */
export async function fetchSheetValuesGrid(): Promise<string[][]> {
  const { formats } = await fetchHotSheetGrids();
  return formats;
}
