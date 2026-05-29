import { expect, test } from "@playwright/test";

import {
  projectGeoToMapPercent,
  projectUserLocationOnMap,
  resolveCampusMapPoint,
} from "../lib/sites/map-projection";
import {
  getContainedMapRect,
  mapPercentPointToScreenPoint,
} from "../lib/sites/map-render";
import type { MapGeoControlPoint } from "../lib/sites/map-calibration";
import type { SiteCampus, SiteScopeCard } from "../lib/sites/scope-card";

function makeSite(slug: string, campus: SiteCampus): SiteScopeCard {
  return {
    slug,
    name: slug,
    fullName: slug,
    routeSlugs: [slug],
    type: "school",
    city: "moscow",
    cityLabel: "Москва",
    locationLabel: "Test",
    locationSummary: "Test",
    campusCount: 1,
    campuses: [campus],
    courseCount: 1,
    courseSlugs: ["test"],
    shiftCount: 1,
    studentCount: 0,
    activityScore: 1,
    listedOnSites: true,
    hasMapCoordinates: typeof campus.latitude === "number" && typeof campus.longitude === "number",
  };
}

test.describe("Map projection helpers", () => {
  test("projects geo coordinates through affine control points", () => {
    const controlPoints: MapGeoControlPoint[] = [
      { x: 20, y: 20, latitude: 0, longitude: 0 },
      { x: 80, y: 20, latitude: 0, longitude: 1 },
      { x: 20, y: 80, latitude: 1, longitude: 0 },
    ];

    const point = projectGeoToMapPercent(0.25, 0.5, controlPoints);

    expect(point.x).toBeCloseTo(50, 1);
    expect(point.y).toBeCloseTo(35, 1);
  });

  test("returns edge direction and distance for locations outside map bounds", () => {
    const location = projectUserLocationOnMap(0.5, 2, {
      west: 0,
      east: 1,
      south: 0,
      north: 1,
    });

    expect(location.status).toBe("outside");
    if (location.status !== "outside") return;

    expect(location.point.x).toBe(92);
    expect(location.point.y).toBeCloseTo(50, 1);
    expect(location.directionDegrees).toBeCloseTo(0, 1);
    expect(location.distanceKm).toBeGreaterThan(100);
  });

  test("prefers geo projection over legacy site-level points", () => {
    const campus: SiteCampus = {
      slug: "main",
      name: "Main",
      headline: "Test",
      address: "Test",
      latitude: 0.25,
      longitude: 0.5,
    };
    const site = makeSite("legacy-site", campus);
    const controlPoints: MapGeoControlPoint[] = [
      { x: 20, y: 20, latitude: 0, longitude: 0 },
      { x: 80, y: 20, latitude: 0, longitude: 1 },
      { x: 20, y: 80, latitude: 1, longitude: 0 },
    ];

    const point = resolveCampusMapPoint({
      site,
      campus,
      index: 0,
      sitePoints: {
        "legacy-site": { x: 90, y: 90 },
      },
      geoControlPoints: controlPoints,
    });

    expect(point.x).toBeCloseTo(50, 1);
    expect(point.y).toBeCloseTo(35, 1);
  });

  test("keeps campus-specific manual points stronger than geo projection", () => {
    const campus: SiteCampus = {
      slug: "main",
      name: "Main",
      headline: "Test",
      address: "Test",
      latitude: 0.25,
      longitude: 0.5,
    };
    const site = makeSite("manual-site", campus);
    const controlPoints: MapGeoControlPoint[] = [
      { x: 20, y: 20, latitude: 0, longitude: 0 },
      { x: 80, y: 20, latitude: 0, longitude: 1 },
      { x: 20, y: 80, latitude: 1, longitude: 0 },
    ];

    const point = resolveCampusMapPoint({
      site,
      campus,
      index: 0,
      sitePoints: {
        "manual-site": { x: 90, y: 90 },
        "manual-site:main": { x: 12, y: 34 },
      },
      geoControlPoints: controlPoints,
    });

    expect(point).toEqual({ x: 12, y: 34 });
  });

  test("positions map points inside the contained image rect", () => {
    const mapRect = getContainedMapRect({ width: 1200, height: 600 });

    expect(mapRect).toEqual({ x: 300, y: 0, width: 600, height: 600 });
    expect(
      mapPercentPointToScreenPoint(
        { x: 50, y: 50 },
        mapRect,
        { scale: 1, positionX: 0, positionY: 0 },
      ),
    ).toEqual({ x: 600, y: 300 });
  });

  test("keeps contained map point alignment under pan and zoom", () => {
    const mapRect = getContainedMapRect({ width: 600, height: 900 });

    expect(mapRect).toEqual({ x: 0, y: 150, width: 600, height: 600 });
    expect(
      mapPercentPointToScreenPoint(
        { x: 25, y: 75 },
        mapRect,
        { scale: 2, positionX: -100, positionY: 40 },
      ),
    ).toEqual({ x: 200, y: 1240 });
  });
});
