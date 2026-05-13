const SCHOOL_TO_VENUE: Record<string, string> = {
  "Школа №1212": "school-1212-yasenevo",
  "Школа №2103": "school-2103-yasenevo",
  "Школа №937": "school-937-orekhovo",
  "Школа №1383": "school-1383-verkhnie-likhobory",
  "Школа №1517": "school-1517-narodnoe-opolchenie",
  "Школа №17": "school-17-belyaevo",
  "Школа №875": "school-875-yugo-zapadnaya",
};

export function venueSlugFromSchoolName(schoolName: string): string | null {
  const key = schoolName.trim();
  if (!key) return null;
  return SCHOOL_TO_VENUE[key] ?? null;
}

