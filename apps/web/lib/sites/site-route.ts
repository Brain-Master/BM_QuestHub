import type { Venue } from "@/lib/schemas";

export function buildSiteHref(slug: string): string {
  return `/sites/${slug}`;
}

export function buildVenueSiteHref(venue: Pick<Venue, "slug" | "schoolScopeSlug">): string {
  return buildSiteHref(venue.schoolScopeSlug ?? venue.slug);
}
