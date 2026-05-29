import type { Venue } from "@/lib/schemas";

function uniqueNames(venues: readonly Venue[]): string[] {
  return Array.from(new Set(venues.map((venue) => venue.name)));
}

/** Primary line for a campus row when names are shared across buildings. */
export function resolveCampusHeadline(venues: readonly Venue[], venue: Venue): string {
  if (uniqueNames(venues).length === 1) return venue.address;
  return venue.name;
}

export type SchoolCampusLocation = {
  headline: string;
  address: string;
  metro?: string;
  district?: string;
};

export function resolveSchoolCampusLocations(venues: readonly Venue[]): SchoolCampusLocation[] {
  return venues.map((venue) => ({
    headline: resolveCampusHeadline(venues, venue),
    address: venue.address,
    metro: venue.metro && venue.metro !== "—" ? venue.metro : undefined,
    district: venue.district,
  }));
}
