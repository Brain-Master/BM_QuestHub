import type { SchoolScope } from "@/lib/offers/agenda";
import type { Quest, Venue, World } from "@/lib/schemas";
import { pluralizeRuLabel } from "@/lib/i18n/pluralize-ru";
import { buildAgendaItems } from "@/lib/offers/agenda";
import { resolveScheduleStatusKey } from "@/lib/offers/schedule-board";
import { resolveCampusHeadline } from "@/lib/sites/campus-label";
import { DEFAULT_CITY, getCityLabel } from "@/lib/sites/city-card";

export { DEFAULT_CITY };

export type SiteCampus = {
  slug: string;
  /** Current groups at this exact address, not across the whole school. */
  shiftCount?: number;
  name: string;
  headline: string;
  address: string;
  metro?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  directions: string[];
  entranceNote?: string;
  contactNote?: string;
  photos: NonNullable<Venue["photos"]>;
};

export type SiteScopeCard = {
  slug: string;
  name: string;
  fullName: string;
  routeSlugs: string[];
  type: Venue["type"];
  city: string;
  cityLabel: string;
  logoUrl?: string;
  mapColor?: string;
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
  if (campusCount > 1) {
    return `${location} · ${pluralizeRuLabel(campusCount, ["корпус", "корпуса", "корпусов"])}`;
  }

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
  /** When true, keep sites with courses even if schedule rows are not loaded yet. */
  scheduleLoading?: boolean;
  /** Profile/QR identity survives even when no current groups are available. */
  includeInactive?: boolean;
}): SiteScopeCard[] {
  const scheduleLoading = params.scheduleLoading ?? false;
  return params.scopes
    .map((scope) => {
      const primaryVenue = scope.venues[0];
      const city = primaryVenue?.city ?? DEFAULT_CITY;
      const scopeVenues = new Set(scope.venues.map(v=>v.slug));
      const scopedAgendaItems = buildAgendaItems({
        quests: params.quests.filter(q=>q.activeInCampaign),
        venues: params.venues,
        worlds: params.worlds,
      }).filter(item=>scopeVenues.has(item.venue.slug) && !["finished","cancelled"].includes(resolveScheduleStatusKey(item.offer)));
      const scopedQuests = params.quests.filter(q=>scopedAgendaItems.some(item=>item.quest.slug===q.slug));
      const campuses = scope.venues.map((venue) => ({
        slug: venue.slug,
        shiftCount: scopedAgendaItems.filter(item => item.venue.slug === venue.slug).length,
        name: venue.name,
        headline: resolveCampusHeadline(scope.venues, venue),
        address: venue.address,
        metro: venue.metro,
        district: venue.district,
        latitude: venue.latitude,
        longitude: venue.longitude,
        directions: venue.directions,
        entranceNote: venue.entranceNote,
        contactNote: venue.contactNote,
        photos: venue.photos,
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
        fullName: primaryVenue?.name ?? scope.name,
        routeSlugs: scope.routeSlugs,
        type: primaryVenue?.type ?? "school",
        city,
        cityLabel: getCityLabel(city),
        logoUrl: primaryVenue?.logoUrl,
        mapColor: primaryVenue?.mapColor,
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
    .filter((card) => {
      if (params.includeInactive) return true;
      if (!card.listedOnSites) return false;
      if (scheduleLoading) return card.courseCount > 0;
      return card.shiftCount > 0;
    });
}
