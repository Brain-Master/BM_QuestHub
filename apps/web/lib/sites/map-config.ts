import siteConfig from "@/data/v2/site-config.json";

import type { MapConfig } from "@/lib/data/v2/site-config";

export const SITE_MAP_CONFIG: MapConfig = siteConfig.map;

export const MOSCOW_MAP_BOUNDS = SITE_MAP_CONFIG.bounds;

export const METRO_MAP_ANCHORS = SITE_MAP_CONFIG.metroAnchors;

export const MAP_FALLBACK_ANCHORS = SITE_MAP_CONFIG.fallbackAnchors;
