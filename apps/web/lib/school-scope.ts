import type { Quest, Venue } from "@/lib/schemas";

/** Базы BM видны в любом скоупе; школьные площадки — при совпадении schoolScopeSlug. */
export function venueVisibleForSchoolScope(
  venue: Venue,
  schoolSlug: string | undefined,
): boolean {
  if (!schoolSlug) return true;
  if (venue.type === "bm_base") return true;
  if (venue.schoolScopeSlug && venue.schoolScopeSlug === schoolSlug)
    return true;
  return false;
}

export function filterQuestsForSchool(
  quests: Quest[],
  venues: Venue[],
  schoolSlug: string | undefined,
): Quest[] {
  if (!schoolSlug) return quests.filter((q) => q.activeInCampaign);
  const vmap = new Map(venues.map((v) => [v.slug, v]));
  return quests.filter((q) => {
    if (!q.activeInCampaign) return false;
    return q.offers.some((o) => {
      const v = vmap.get(o.venueSlug);
      if (!v) return false;
      return venueVisibleForSchoolScope(v, schoolSlug);
    });
  });
}
