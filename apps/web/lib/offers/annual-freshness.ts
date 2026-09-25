import type { VenueOffer } from "../schemas";

export const AVAILABILITY_MAX_AGE_MS = 15 * 60_000;

/** A recent build is not a recent card check. Unknown/future dates fail closed. */
export function annualAvailabilityStale(annual: VenueOffer["annual"], nowMs: number): boolean {
  if (!annual) return false;
  const checked = Date.parse(annual.availabilityUpdatedAt ?? annual.refreshedAt ?? "");
  return !!(annual.availabilityError || annual.refreshError) || nowMs <= 0 ||
    !Number.isFinite(checked) || checked > nowMs + 60_000 || nowMs - checked > AVAILABILITY_MAX_AGE_MS;
}
