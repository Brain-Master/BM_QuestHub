import type { Venue } from "@/lib/schemas";

/** Short label for schedule cards and filters; falls back to legal name. */
export function resolveVenueShortName(
  venue: Pick<Venue, "name" | "displayName">,
): string {
  return venue.displayName?.trim() || venue.name;
}
