export const SITE_MAP_POINTS = {
  "school-1383": { x: 48, y: 25 },
  "school-1517": { x: 35, y: 45 },
  "school-875": { x: 35, y: 72 },
  "school-17": { x: 42, y: 78 },
  "school-1212": { x: 46, y: 83 },
  "school-2103": { x: 47, y: 87 },
  "school-937": { x: 65, y: 82 },
  "bm-base-moscow": { x: 50, y: 40 },
} as const satisfies Record<string, { x: number; y: number }>;

export type MapGeoControlPoint = {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
};

export const MAP_GEO_CONTROL_POINTS = [
  { x: 27.49, y: 43.47, latitude: 55.77282, longitude: 37.448746 },
  { x: 78.9, y: 52.03, latitude: 55.73497, longitude: 37.84825 },
  { x: 40.03, y: 84.15, latitude: 55.594414, longitude: 37.546632 },
  { x: 70.23, y: 13.29, latitude: 55.904091, longitude: 37.780905 },
  { x: 48.01, y: 51.17, latitude: 55.738671, longitude: 37.60833 },
] as const satisfies readonly MapGeoControlPoint[];

export type SiteMapCalibrationConfig = {
  city: string;
  label: string;
  imageSrc: string;
  sitePoints: Record<string, { x: number; y: number }>;
  geoControlPoints: readonly MapGeoControlPoint[];
};

export const SITE_MAP_CALIBRATIONS = [
  {
    city: "moscow",
    label: "Москва",
    imageSrc: "/sites/moscow-cyber-map.webp",
    sitePoints: SITE_MAP_POINTS,
    geoControlPoints: MAP_GEO_CONTROL_POINTS,
  },
] as const satisfies readonly SiteMapCalibrationConfig[];
