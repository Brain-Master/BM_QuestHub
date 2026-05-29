import type { AgendaOfferItem } from "@/lib/offers/agenda";
import type { ScheduleCard, Venue } from "@/lib/schemas";
import { resolveVenueShortName } from "@/lib/sites/venue-label";

/** Address shown on schedule cards: Hot group row overrides cold venue when set. */
export function resolveScheduleAddress(
  venue: Pick<Venue, "address">,
  card?: Pick<ScheduleCard, "addressOverride"> | null,
): string {
  const override = card?.addressOverride?.trim();
  return override || venue.address;
}

export function venueWithScheduleAddress(
  venue: Venue,
  card?: Pick<ScheduleCard, "addressOverride"> | null,
): Venue {
  return {
    ...venue,
    address: resolveScheduleAddress(venue, card),
  };
}

export function resolveScheduleVenueForMaps(
  item: Pick<AgendaOfferItem, "venue" | "offer">,
): Pick<Venue, "name" | "metro" | "address"> {
  const address = resolveScheduleAddress(item.venue, item.offer.scheduleCard);
  return {
    name: resolveVenueShortName(item.venue),
    metro: item.venue.metro,
    address,
  };
}
