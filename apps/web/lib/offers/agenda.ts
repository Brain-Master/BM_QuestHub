import type { Quest, Venue, VenueOffer, World } from "@/lib/schemas";
import { venueVisibleForSchoolScope } from "@/lib/school-scope";

export type AgendaOfferItem = {
  offer: VenueOffer;
  quest: Pick<
    Quest,
    | "slug"
    | "title"
    | "worldSlug"
    | "ageLabel"
    | "catalogTagline"
    | "tagline"
    | "heroImageUrl"
  >;
  venue: Venue;
  world: Pick<World, "slug" | "name" | "themeKey"> | null;
};

export type AgendaOfferGroup = {
  key: string;
  label: string;
  items: AgendaOfferItem[];
};

export type SchoolScope = {
  slug: string;
  name: string;
  routeSlugs: string[];
  venues: Venue[];
};

function compareAgendaItems(a: AgendaOfferItem, b: AgendaOfferItem): number {
  const date = a.offer.startDate.localeCompare(b.offer.startDate);
  if (date !== 0) return date;
  const time = a.offer.startTime.localeCompare(b.offer.startTime);
  if (time !== 0) return time;
  return a.quest.title.localeCompare(b.quest.title, "ru");
}

function formatAgendaRange(offer: VenueOffer): string {
  if (offer.startDate === offer.endDate) return offer.dateRange;
  return offer.dateRange;
}

export function buildAgendaItems(params: {
  quests: Quest[];
  venues: Venue[];
  worlds: World[];
  schoolSlug?: string;
}): AgendaOfferItem[] {
  const venueBySlug = new Map(params.venues.map((v) => [v.slug, v]));
  const worldBySlug = new Map(params.worlds.map((w) => [w.slug, w]));
  const items: AgendaOfferItem[] = [];

  for (const quest of params.quests) {
    if (!quest.activeInCampaign) continue;

    for (const offer of quest.offers) {
      const venue = venueBySlug.get(offer.venueSlug);
      if (!venue) continue;
      if (!venueVisibleForSchoolScope(venue, params.schoolSlug)) continue;

      items.push({
        offer,
        quest: {
          slug: quest.slug,
          title: quest.title,
          worldSlug: quest.worldSlug,
          ageLabel: quest.ageLabel,
          catalogTagline: quest.catalogTagline,
          tagline: quest.tagline,
          heroImageUrl: quest.heroImageUrl,
        },
        venue,
        world: worldBySlug.get(quest.worldSlug) ?? null,
      });
    }
  }

  return items.sort(compareAgendaItems);
}

export function groupAgendaItems(items: AgendaOfferItem[]): AgendaOfferGroup[] {
  const groups = new Map<string, AgendaOfferGroup>();

  for (const item of items) {
    const key = item.offer.startDate;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(key, {
      key,
      label: formatAgendaRange(item.offer),
      items: [item],
    });
  }

  return Array.from(groups.values());
}

function routeSlugsForSchoolScope(slug: string): string[] {
  const aliases = [slug];
  const short = slug.match(/^school-(.+)$/)?.[1];
  if (short) aliases.push(short);
  return aliases;
}

export function getSchoolScopes(venues: Venue[]): SchoolScope[] {
  const byScope = new Map<string, SchoolScope>();

  for (const venue of venues) {
    if (venue.type !== "school" || !venue.schoolScopeSlug) continue;
    const current = byScope.get(venue.schoolScopeSlug);
    if (current) {
      current.venues.push(venue);
      continue;
    }
    byScope.set(venue.schoolScopeSlug, {
      slug: venue.schoolScopeSlug,
      name: venue.name,
      routeSlugs: routeSlugsForSchoolScope(venue.schoolScopeSlug),
      venues: [venue],
    });
  }

  return Array.from(byScope.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "ru"),
  );
}

export function resolveSchoolScope(
  venues: Venue[],
  routeSlug: string,
): SchoolScope | undefined {
  return getSchoolScopes(venues).find((school) =>
    school.routeSlugs.includes(routeSlug),
  );
}
