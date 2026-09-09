import type { SiteScopeCard } from "@/lib/sites/scope-card";

export const INACTIVE_MAP_MARKER_COLOR = "#94a3b8";
export function campusHasNoGroups(site: SiteScopeCard, campus: SiteScopeCard["campuses"][number]): boolean {
  return (campus.shiftCount ?? site.shiftCount) === 0;
}

const GOLDEN_ANGLE = 137.508;
const BASE_HUE = 24;

function hashSlug(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getSiteMapColor(site: SiteScopeCard): string {
  if (site.shiftCount === 0) return INACTIVE_MAP_MARKER_COLOR;
  if (site.mapColor) return site.mapColor;

  const hue = (hashSlug(site.slug) * GOLDEN_ANGLE + BASE_HUE) % 360;
  return `hsl(${hue.toFixed(0)} 82% 56%)`;
}

export function buildSiteMapColorMap(sites: SiteScopeCard[]): Map<string, string> {
  const uniqueSites = Array.from(new Map(sites.map((site) => [site.slug, site])).values()).sort(
    (a, b) => a.slug.localeCompare(b.slug),
  );

  return new Map(
    uniqueSites.map((site, index) => {
      const hue = (BASE_HUE + index * GOLDEN_ANGLE) % 360;
      return [site.slug, site.shiftCount === 0 ? INACTIVE_MAP_MARKER_COLOR : site.mapColor ?? `hsl(${hue.toFixed(0)} 82% 56%)`];
    }),
  );
}
