import type { Quest, Venue } from "@/lib/schemas";
import { parseProgramFilterValue } from "@/lib/program-filter-options";
import { resolveSchoolScope } from "@/lib/offers/agenda";
import { resolveScheduleStatusKey } from "@/lib/offers/schedule-board";

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
  if (params.format && !["all","intensive","year"].includes(params.format)) return [];
  if (params.status && !["all","active","archived"].includes(params.status)) return [];
  if (params.program && params.program !== "all" && parseProgramFilterValue(params.program).kind === "all") return [];
  const school = params.school && params.school !== "all" ? resolveSchoolScope(venues, params.school) : undefined;
  if (params.school && params.school !== "all" && !school) return [];
  const venueIds = school ? new Set(school.venues.map(v=>v.slug)) : null;
  let next = quests.map(q=>({...q, offers:q.offers.filter(offer=>{
    if (venueIds && !venueIds.has(offer.venueSlug)) return false;
    const archived = !q.activeInCampaign || ["finished", "cancelled"].includes(resolveScheduleStatusKey(offer));
    return params.status === "all" || (params.status === "archived" ? archived : !archived);
  })})).filter(q=>q.offers.length > 0);

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

  if (params.age && params.age !== "all") {
    next = next.filter((q) => q.ageLabel === params.age);
  }

  return next;
}
