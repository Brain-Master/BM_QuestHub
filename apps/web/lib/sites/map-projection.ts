import type { SiteCampus, SiteScopeCard } from "@/lib/sites/scope-card";

/** Bounding box for Moscow city proper (approx.), used for lat/lon → map percent. */
export const MOSCOW_MAP_BOUNDS = {
  west: 37.35,
  east: 37.88,
  north: 55.92,
  south: 55.55,
} as const;

export type MapPercentPoint = {
  x: number;
  y: number;
};

/** Metro anchors calibrated to apps/web/public/sites/moscow-cyber-map.webp. */
const METRO_ANCHORS: Record<string, MapPercentPoint> = {
  "Верхние Лихоборы": { x: 48, y: 25 },
  "Народное Ополчение": { x: 35, y: 45 },
  "Юго-Западная": { x: 35, y: 72 },
  Беляево: { x: 42, y: 78 },
  Ясенево: { x: 46, y: 85 },
  Орехово: { x: 65, y: 82 },
};

const FALLBACK_ANCHORS: MapPercentPoint[] = [
  { x: 50, y: 40 },
  { x: 42, y: 54 },
  { x: 60, y: 56 },
  { x: 48, y: 66 },
];

export const MAP_COLLISION_OFFSETS = [
  { x: 0, y: 0 },
  { x: 3.5, y: -2.5 },
  { x: -3.5, y: 2.5 },
  { x: 3.5, y: 3.5 },
  { x: -3.5, y: -3.5 },
] as const;

export function projectLatLonToPercent(
  latitude: number,
  longitude: number,
  bounds = MOSCOW_MAP_BOUNDS,
): MapPercentPoint {
  const { west, east, north, south } = bounds;
  const x = ((longitude - west) / (east - west)) * 100;
  const y = ((north - latitude) / (north - south)) * 100;

  return {
    x: clampPercent(x),
    y: clampPercent(y),
  };
}

export function clampPercent(value: number): number {
  return Math.min(92, Math.max(8, value));
}

function primaryCampus(site: SiteScopeCard): SiteCampus | undefined {
  return (
    site.campuses.find(
      (campus) =>
        typeof campus.latitude === "number" && typeof campus.longitude === "number",
    ) ?? site.campuses[0]
  );
}

function primaryMetro(site: SiteScopeCard): string | undefined {
  return site.campuses.find((campus) => campus.metro && campus.metro !== "—")?.metro;
}

export function resolveSiteMapPoint(site: SiteScopeCard, index: number): MapPercentPoint {
  const campus = primaryCampus(site);
  if (
    campus &&
    typeof campus.latitude === "number" &&
    typeof campus.longitude === "number"
  ) {
    return projectLatLonToPercent(campus.latitude, campus.longitude);
  }

  const metro = primaryMetro(site);
  if (metro && METRO_ANCHORS[metro]) return METRO_ANCHORS[metro];

  return FALLBACK_ANCHORS[index % FALLBACK_ANCHORS.length];
}

export type PositionedSiteOnMap = MapPercentPoint & {
  site: SiteScopeCard;
};

export function positionSitesOnMap(sites: SiteScopeCard[]): PositionedSiteOnMap[] {
  const pointCounts = new Map<string, number>();

  return sites.map((site, index) => {
    const point = resolveSiteMapPoint(site, index);
    const key = `${Math.round(point.x)}:${Math.round(point.y)}`;
    const collisionIndex = pointCounts.get(key) ?? 0;
    const offset = MAP_COLLISION_OFFSETS[collisionIndex % MAP_COLLISION_OFFSETS.length];
    pointCounts.set(key, collisionIndex + 1);

    return {
      site,
      x: clampPercent(point.x + offset.x),
      y: clampPercent(point.y + offset.y),
    };
  });
}

export function siteHasMapLocation(site: SiteScopeCard): boolean {
  return site.campuses.some(
    (campus) =>
      Boolean(campus.address) ||
      Boolean(campus.metro && campus.metro !== "—") ||
      (typeof campus.latitude === "number" && typeof campus.longitude === "number"),
  );
}

export const MOSCOW_MAP_ATTRIBUTION = {
  label: "Static cyber map backdrop",
  href: "/sites/moscow-cyber-map.webp",
  note: "Replace apps/web/public/sites/moscow-cyber-map.webp with the licensed production export anytime.",
} as const;
