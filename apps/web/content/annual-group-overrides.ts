/** Owner-confirmed curriculum facts, 2026-09-09. Not inferred from pupil age. */
export function reviewedStudyYear(schoolSlug: string): 1 | undefined {
  return schoolSlug === "school-2044" ? 1 : undefined;
}

/** Owner confirmation, 2026-09-09. Annual groups only; historical shifts are untouched. */
export function reviewedTeacher(schoolSlug: string, studyYear?: number | null): string | undefined {
  if (schoolSlug === "school-1212" || (schoolSlug === "school-17" && studyYear === 2)) {
    return "Толмачева Василиса Владимировна";
  }
  if (schoolSlug === "school-17" && studyYear === 1) return "Мартынова Анна Александровна";
  return undefined;
}

/** Missing CSV codes resolved by unique listing, matching campus and weekly slot.
 * Verified against public card APIs 923308 and 1000004 on 2026-09-09.
 * Keep original listing:* offer IDs so previously shared links continue to resolve.
 */
export const reviewedGroupCodes: Record<string, string> = {
  "listing:2415012": "К7419-26",
  "listing:2542312": "К7732-26",
};
