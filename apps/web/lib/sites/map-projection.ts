import {
  MAP_GEO_CONTROL_POINTS,
  SITE_MAP_POINTS,
  type MapGeoControlPoint,
} from "@/lib/sites/map-calibration";
import {
  MAP_FALLBACK_ANCHORS,
  METRO_MAP_ANCHORS,
  MOSCOW_MAP_BOUNDS,
} from "@/lib/sites/map-config";
import type { SiteCampus, SiteScopeCard } from "@/lib/sites/scope-card";

export { MOSCOW_MAP_BOUNDS };

type MapGeoBounds = typeof MOSCOW_MAP_BOUNDS;

export type MapPercentPoint = {
  x: number;
  y: number;
};

export type ProjectedUserLocation =
  | {
      status: "inside";
      point: MapPercentPoint;
      distanceKm: 0;
    }
  | {
      status: "outside";
      point: MapPercentPoint;
      directionDegrees: number;
      distanceKm: number;
    };

export function projectLatLonToPercent(
  latitude: number,
  longitude: number,
  bounds = MOSCOW_MAP_BOUNDS,
): MapPercentPoint {
  const { x, y } = projectLatLonToRawPercent(latitude, longitude, bounds);

  return {
    x: clampPercent(x),
    y: clampPercent(y),
  };
}

export function projectGeoToMapPercent(
  latitude: number,
  longitude: number,
  controlPoints: readonly MapGeoControlPoint[] = MAP_GEO_CONTROL_POINTS,
): MapPercentPoint {
  const affinePoint = projectGeoToAffinePercent(latitude, longitude, controlPoints);
  return affinePoint ?? projectLatLonToPercent(latitude, longitude);
}

export function projectUserLocationOnMap(
  latitude: number,
  longitude: number,
  bounds: MapGeoBounds = MOSCOW_MAP_BOUNDS,
): ProjectedUserLocation {
  if (isLatLonInsideBounds(latitude, longitude, bounds)) {
    return {
      status: "inside",
      point: projectGeoToMapPercent(latitude, longitude),
      distanceKm: 0,
    };
  }

  const rawPoint = projectLatLonToRawPercent(latitude, longitude, bounds);
  const edgePoint = {
    x: clampPercent(rawPoint.x),
    y: clampPercent(rawPoint.y),
  };
  const nearestLatitude = Math.min(bounds.north, Math.max(bounds.south, latitude));
  const nearestLongitude = Math.min(bounds.east, Math.max(bounds.west, longitude));

  return {
    status: "outside",
    point: edgePoint,
    directionDegrees: Math.atan2(rawPoint.y - edgePoint.y, rawPoint.x - edgePoint.x) * (180 / Math.PI),
    distanceKm: haversineDistanceKm(latitude, longitude, nearestLatitude, nearestLongitude),
  };
}

export function clampPercent(value: number): number {
  return Math.min(92, Math.max(8, value));
}

function projectLatLonToRawPercent(
  latitude: number,
  longitude: number,
  bounds: MapGeoBounds,
): MapPercentPoint {
  const { west, east, north, south } = bounds;
  return {
    x: ((longitude - west) / (east - west)) * 100,
    y: ((north - latitude) / (north - south)) * 100,
  };
}

function projectGeoToAffinePercent(
  latitude: number,
  longitude: number,
  controlPoints: readonly MapGeoControlPoint[],
): MapPercentPoint | null {
  if (controlPoints.length < 3) return null;

  const xCoefficients = solveAffineCoefficients(controlPoints, "x");
  const yCoefficients = solveAffineCoefficients(controlPoints, "y");
  if (!xCoefficients || !yCoefficients) return null;

  return {
    x: clampPercent(xCoefficients[0] * longitude + xCoefficients[1] * latitude + xCoefficients[2]),
    y: clampPercent(yCoefficients[0] * longitude + yCoefficients[1] * latitude + yCoefficients[2]),
  };
}

function solveAffineCoefficients(
  controlPoints: readonly MapGeoControlPoint[],
  target: "x" | "y",
): [number, number, number] | null {
  const matrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const vector = [0, 0, 0];

  for (const point of controlPoints) {
    const row = [point.longitude, point.latitude, 1];
    for (let i = 0; i < 3; i += 1) {
      vector[i] += row[i] * point[target];
      for (let j = 0; j < 3; j += 1) {
        matrix[i][j] += row[i] * row[j];
      }
    }
  }

  return solveLinearSystem3(matrix, vector);
}

function solveLinearSystem3(matrix: number[][], vector: number[]): [number, number, number] | null {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let pivot = 0; pivot < 3; pivot += 1) {
    let pivotRow = pivot;
    for (let row = pivot + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[pivotRow][pivot])) {
        pivotRow = row;
      }
    }

    if (Math.abs(augmented[pivotRow][pivot]) < 1e-9) return null;

    [augmented[pivot], augmented[pivotRow]] = [augmented[pivotRow], augmented[pivot]];

    const pivotValue = augmented[pivot][pivot];
    for (let column = pivot; column < 4; column += 1) {
      augmented[pivot][column] /= pivotValue;
    }

    for (let row = 0; row < 3; row += 1) {
      if (row === pivot) continue;
      const factor = augmented[row][pivot];
      for (let column = pivot; column < 4; column += 1) {
        augmented[row][column] -= factor * augmented[pivot][column];
      }
    }
  }

  return [augmented[0][3], augmented[1][3], augmented[2][3]];
}

function isLatLonInsideBounds(
  latitude: number,
  longitude: number,
  bounds: MapGeoBounds,
): boolean {
  return (
    longitude >= bounds.west &&
    longitude <= bounds.east &&
    latitude >= bounds.south &&
    latitude <= bounds.north
  );
}

function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function campusHasMapLocation(campus: SiteCampus): boolean {
  return (
    Boolean(campus.address) ||
    Boolean(campus.metro && campus.metro !== "—") ||
    (typeof campus.latitude === "number" && typeof campus.longitude === "number")
  );
}

export function getCampusMapPointKey(site: SiteScopeCard, campus: SiteCampus): string {
  return `${site.slug}:${campus.slug}`;
}

export function resolveCampusMapPoint(params: {
  site: SiteScopeCard;
  campus: SiteCampus;
  index: number;
  sitePoints?: Record<string, MapPercentPoint>;
  geoControlPoints?: readonly MapGeoControlPoint[];
}): MapPercentPoint {
  const {
    site,
    campus,
    index,
    sitePoints = SITE_MAP_POINTS as Record<string, MapPercentPoint>,
    geoControlPoints = MAP_GEO_CONTROL_POINTS,
  } = params;
  const campusKey = getCampusMapPointKey(site, campus);
  const calibratedCampusPoint = sitePoints[campusKey];
  if (calibratedCampusPoint) return calibratedCampusPoint;

  if (
    typeof campus.latitude === "number" &&
    typeof campus.longitude === "number"
  ) {
    return projectGeoToMapPercent(campus.latitude, campus.longitude, geoControlPoints);
  }

  const calibratedSitePoint = sitePoints[site.slug];
  if (calibratedSitePoint) return calibratedSitePoint;

  const metroAnchor =
    campus.metro &&
    METRO_MAP_ANCHORS[campus.metro as keyof typeof METRO_MAP_ANCHORS];
  if (metroAnchor) {
    return metroAnchor;
  }

  return MAP_FALLBACK_ANCHORS[index % MAP_FALLBACK_ANCHORS.length];
}

export type PositionedSiteOnMapPoint = MapPercentPoint & {
  id: string;
  calibrationKey: string;
  site: SiteScopeCard;
  campus: SiteCampus;
};

export function positionSitesOnMap(sites: SiteScopeCard[]): PositionedSiteOnMapPoint[] {
  return sites.flatMap((site, siteIndex) =>
    site.campuses.filter(campusHasMapLocation).map((campus, campusIndex) => {
      const point = resolveCampusMapPoint({
        site,
        campus,
        index: siteIndex + campusIndex,
      });
      const calibrationKey = getCampusMapPointKey(site, campus);

      return {
        id: calibrationKey,
        calibrationKey,
        site,
        campus,
        x: clampPercent(point.x),
        y: clampPercent(point.y),
      };
    }),
  );
}

export function siteHasMapLocation(site: SiteScopeCard): boolean {
  return site.campuses.some(campusHasMapLocation);
}

export const MOSCOW_MAP_ATTRIBUTION = {
  label: "Static cyber map backdrop",
  href: "/sites/moscow-cyber-map.webp",
  note: "Replace apps/web/public/sites/moscow-cyber-map.webp with the licensed production export anytime.",
} as const;
