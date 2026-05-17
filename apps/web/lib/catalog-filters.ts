import type { Quest, Venue } from "@/lib/schemas";
import { parseProgramFilterValue } from "@/lib/program-filter-options";
import { filterQuestsForSchool } from "@/lib/school-scope";

export type CatalogSearchParams = {
  format?: string;
  program?: string;
  /** Legacy URL param kept so older catalog links still resolve to the same series filter. */
  world?: string;
  age?: string;
  status?: string;
  school?: string;
};

export function filterCatalog(
  quests: Quest[],
  venues: Venue[],
  params: CatalogSearchParams,
): Quest[] {
  let next = params.school
    ? filterQuestsForSchool(quests, venues, params.school)
    : quests;

  if (params.status === "archived") {
    next = next.filter((q) => !q.activeInCampaign);
  } else if (params.status !== "all") {
    next = next.filter((q) => q.activeInCampaign);
  }

  if (params.format === "intensive" || params.format === "year") {
    next = next.filter((q) => q.format === params.format);
  }

  const program = parseProgramFilterValue(params.program);
  if (program.kind === "series") {
    next = next.filter((q) => q.worldSlug === program.slug);
  } else if (program.kind === "quest") {
    next = next.filter((q) => q.slug === program.slug);
  } else if (params.world) {
    next = next.filter((q) => q.worldSlug === params.world);
  }

  if (params.age) {
    next = next.filter((q) => q.ageLabel === params.age);
  }

  return next;
}
