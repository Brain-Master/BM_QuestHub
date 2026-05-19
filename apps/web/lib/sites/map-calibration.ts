import siteConfig from "@/data/v2/site-config.json";

import type { MapGeoControlPoint } from "@/lib/data/v2/site-config";

export type { MapGeoControlPoint };

export const SITE_MAP_POINTS = siteConfig.map.sitePoints;

export const MAP_GEO_CONTROL_POINTS =
  siteConfig.map.geoControlPoints as readonly MapGeoControlPoint[];

export type SiteMapCalibrationConfig = {
  city: string;
  label: string;
  imageSrc: string;
  sitePoints: Record<string, { x: number; y: number }>;
  geoControlPoints: readonly MapGeoControlPoint[];
};

export const SITE_MAP_CALIBRATIONS = [
  {
    city: siteConfig.map.city,
    label: siteConfig.map.label,
    imageSrc: siteConfig.map.imageSrc,
    sitePoints: SITE_MAP_POINTS,
    geoControlPoints: MAP_GEO_CONTROL_POINTS,
  },
] as const satisfies readonly SiteMapCalibrationConfig[];
