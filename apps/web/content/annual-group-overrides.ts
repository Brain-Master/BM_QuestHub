/** Owner-confirmed curriculum facts, 2026-09-09. Not inferred from pupil age. */
import {reviewedAnnualAge} from './annual-owner-ages.mjs';
const school37Years: Record<string, 1 | 2> = {
  'К2763-26':1, 'К2764-26':1, 'К2765-26':2,
  'К2766-26':1, 'К2767-26':1, 'К2768-26':2,
  'К2769-26':1, 'К2770-26':1, 'К2771-26':2,
};
/** Owner confirmed beginners=SHMI1, continuing=SHMI2 for these nine groups only. */
export function reviewedStudyYear(schoolSlug: string, groupCode?: string | null): 1 | 2 | undefined {
  if (schoolSlug === "school-2044" || schoolSlug === "school-1212") return 1;
  if (schoolSlug === 'school-937' && groupCode && school937Codes.has(groupCode)) return 2;
  return schoolSlug === 'school-37' && groupCode ? school37Years[groupCode] : undefined;
}

/** Owner confirmation, 2026-09-09. Annual groups only; historical shifts are untouched. */
export function reviewedTeacher(schoolSlug: string, studyYear?: number | null, groupCode?: string | null): string | undefined {
  if (schoolSlug === 'school-937' && groupCode && school937Codes.has(groupCode)) return 'Локтеева Ирина Дмитриевна';
  if (schoolSlug === 'school-37' && groupCode && school37Years[groupCode]) return 'Кузнецова Ольга Максимовна';
  if (schoolSlug === "school-1212" || (schoolSlug === "school-17" && studyYear === 2)) {
    return "Толмачева Василиса Владимировна";
  }
  if (schoolSlug === "school-17" && studyYear === 1) return "Мартынова Анна Александровна";
  return undefined;
}

const school937Codes = new Set(['К2215-26','К2216-26','К2217-26','К2218-26']);
/** Owner-confirmed range, not the portal's administrative 6–18 age band. */
export function reviewedAges(schoolSlug: string, groupCode?: string | null) {
  return schoolSlug === 'school-937' ? reviewedAnnualAge(groupCode, undefined) : undefined;
}

/** Missing CSV codes resolved by unique listing, matching campus and weekly slot.
 * Verified against public card APIs 923308 and 1000004 on 2026-09-09.
 * Keep original listing:* offer IDs so previously shared links continue to resolve.
 */
export const reviewedGroupCodes: Record<string, string> = {
  "listing:2415012": "К7419-26",
  "listing:2542312": "К7732-26",
};

/** Owner-confirmed 2026-09-21: exact 2103 groups, 1000 RUB / 1 academic hour. */
const school2103PricedGroups = new Set(['К3015-26','К3016-26','К3020-26','К3021-26','К3022-26','К3024-26','К3025-26','К3026-26','К3027-26']);
export function reviewedLessonPrice(schoolSlug: string, groupCode: string | null) {
  return schoolSlug === 'school-2103' && groupCode !== null && school2103PricedGroups.has(groupCode)
    ? {rubles:1000,minutes:45,source:'owner:2026-09-21' as const} : undefined;
}
