/** Resolve Google Sheets IDs/ranges for hot (schedule) and cold (catalog) spreadsheets. */

export type HotSheetConfig = {
  spreadsheetId: string;
  ranges: {
    groups: string;
    formats: string;
  };
};

export type ColdSheetConfig = {
  spreadsheetId: string;
  ranges: {
    worlds: string;
    venues: string;
    courses: string;
  };
};

const DEFAULT_HOT_ID = "1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8";
const DEFAULT_COLD_ID = "1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc";

export function hotSheetConfig(): HotSheetConfig {
  const spreadsheetId =
    process.env.GOOGLE_SHEETS_HOT_SPREADSHEET_ID?.trim() ||
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ||
    DEFAULT_HOT_ID;

  const groups =
    process.env.GOOGLE_SHEETS_HOT_RANGE_GROUPS?.trim() || "'Группы'!A:AZ";
  const formats =
    process.env.GOOGLE_SHEETS_HOT_RANGE_FORMATS?.trim() || "'Форматы'!A:AZ";

  if (!spreadsheetId) {
    throw new Error(
      "Не задан GOOGLE_SHEETS_HOT_SPREADSHEET_ID (или GOOGLE_SHEETS_SPREADSHEET_ID)",
    );
  }

  return { spreadsheetId, ranges: { groups, formats } };
}

export function coldSheetConfig(): ColdSheetConfig {
  const spreadsheetId =
    process.env.GOOGLE_SHEETS_COLD_SPREADSHEET_ID?.trim() || DEFAULT_COLD_ID;

  if (!spreadsheetId) {
    throw new Error("Не задан GOOGLE_SHEETS_COLD_SPREADSHEET_ID");
  }

  return {
    spreadsheetId,
    ranges: {
      worlds:
        process.env.GOOGLE_SHEETS_COLD_RANGE_WORLDS?.trim() || "'Миры'!A:Z",
      venues:
        process.env.GOOGLE_SHEETS_COLD_RANGE_VENUES?.trim() ||
        "'Площадки'!A:Z",
      courses:
        process.env.GOOGLE_SHEETS_COLD_RANGE_COURSES?.trim() || "'Курсы'!A:Z",
    },
  };
}
