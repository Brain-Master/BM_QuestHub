import type { Quest, Venue } from "@/lib/schemas";
import { filterQuestsForSchool } from "@/lib/school-scope";

export type CatalogSearchParams = {
  format?: string;
  world?: string;
  school?: string;
};

export function filterCatalog(
  quests: Quest[],
  venues: Venue[],
  params: CatalogSearchParams,
): Quest[] {
  let next = params.school
    ? filterQuestsForSchool(quests, venues, params.school)
    : quests.filter((q) => q.activeInCampaign);

  if (params.format === "intensive" || params.format === "year") {
    next = next.filter((q) => q.format === params.format);
  }

  if (params.world) {
    next = next.filter((q) => q.worldSlug === params.world);
  }

  return next;
}
