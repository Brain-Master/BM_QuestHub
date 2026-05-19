import { fetchSheetValuesGrid as fetchGrid } from "@/lib/google/fetch-sheet-grid";
import { hotSheetConfig } from "@/lib/google/sheet-env";

/**
 * Read hot schedule sheet (GOOGLE_SHEETS_HOT_* or legacy GOOGLE_SHEETS_SPREADSHEET_ID).
 */
export async function fetchSheetValuesGrid(): Promise<string[][]> {
  const { spreadsheetId, range } = hotSheetConfig();
  return fetchGrid({ spreadsheetId, range });
}
