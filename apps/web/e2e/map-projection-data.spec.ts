import { expect, test } from "@playwright/test";

import {
  projectGeoToMapPercent,
  projectUserLocationOnMap,
} from "../lib/sites/map-projection";
import type { MapGeoControlPoint } from "../lib/sites/map-calibration";

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
});
