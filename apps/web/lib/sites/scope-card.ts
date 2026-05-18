import type { SchoolScope } from "@/lib/offers/agenda";
import type { Quest, Venue, World } from "@/lib/schemas";
import { buildAgendaItems } from "@/lib/offers/agenda";
import { filterQuestsForSchool } from "@/lib/school-scope";
import { DEFAULT_CITY, getCityLabel } from "@/lib/sites/city-card";

export { DEFAULT_CITY };

export type SiteCampus = {
  slug: string;
  name: string;
  address: string;
  metro?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
};

export type SiteScopeCard = {
  slug: string;
  name: string;
  routeSlugs: string[];
  type: Venue["type"];
  city: string;
  cityLabel: string;
  logoUrl?: string;
  district?: string;
  locationLabel: string;
  locationSummary: string;
  campusCount: number;
  campuses: SiteCampus[];
  courseCount: number;
  courseSlugs: string[];
  shiftCount: number;
  studentCount: number;
  activityScore: number;
  listedOnSites: boolean;
  hasMapCoordinates: boolean;
};

function uniqueLabels(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function resolveLocationLabel(venues: Venue[]): string {
  const districts = uniqueLabels(venues.map((venue) => venue.district));
  if (districts.length > 0) return districts.join(", ");

  const metros = uniqueLabels(venues.map((venue) => venue.metro));
  if (metros.length > 0) return metros.join(", ");

  return "Локация уточняется";
}

function resolveLocationSummary(venues: Venue[], campusCount: number): string {
  const location = resolveLocationLabel(venues);
  if (campusCount > 1) return `${location} · ${campusCount} корпусов`;

  const [venue] = venues;
  if (!venue) return location;

  const parts = [venue.metro, venue.district].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : location;
}

export function buildSiteScopeCards(params: {
  scopes: SchoolScope[];
  quests: Quest[];
  venues: Venue[];
  worlds: World[];
}): SiteScopeCard[] {
  return params.scopes
    .map((scope) => {
      const primaryVenue = scope.venues[0];
      const city = primaryVenue?.city ?? DEFAULT_CITY;
      const scopedQuests = filterQuestsForSchool(params.quests, params.venues, scope.slug);
      const scopedAgendaItems = buildAgendaItems({
        quests: params.quests,
        venues: params.venues,
        worlds: params.worlds,
        schoolSlug: scope.slug,
      });
      const campuses = scope.venues.map((venue) => ({
        slug: venue.slug,
        name: venue.name,
        address: venue.address,
        metro: venue.metro,
        district: venue.district,
        latitude: venue.latitude,
        longitude: venue.longitude,
      }));
      const campusCount = campuses.length;
      const courseSlugs = scopedQuests.map((quest) => quest.slug);
      const courseCount = courseSlugs.length;
      const shiftCount = scopedAgendaItems.length;
      const studentCount = scopedAgendaItems.reduce(
        (sum, item) => sum + (item.offer.enrolled ?? 0),
        0,
      );
      const listedOnSites = primaryVenue?.listedOnSites ?? true;

      return {
        slug: scope.slug,
        name: primaryVenue?.displayName ?? scope.name,
        routeSlugs: scope.routeSlugs,
        type: primaryVenue?.type ?? "school",
        city,
        cityLabel: getCityLabel(city),
        logoUrl: primaryVenue?.logoUrl,
        district: primaryVenue?.district,
        locationLabel: resolveLocationLabel(scope.venues),
        locationSummary: resolveLocationSummary(scope.venues, campusCount),
        campusCount,
        campuses,
        courseCount,
        courseSlugs,
        shiftCount,
        studentCount,
        activityScore: courseCount + shiftCount,
        listedOnSites,
        hasMapCoordinates: campuses.some(
          (campus) =>
            typeof campus.latitude === "number" && typeof campus.longitude === "number",
        ),
      };
    })
    .filter(
      (card) => card.listedOnSites && (card.courseCount > 0 || card.shiftCount > 0),
    );
}

