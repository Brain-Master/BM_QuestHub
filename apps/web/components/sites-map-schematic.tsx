"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Grid2X2,
  LocateFixed,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

import { MetroLabel } from "@/components/metro-label";
import { buttonVariants } from "@/components/ui/button";
import { buildSiteMapColorMap, getSiteMapColor, campusHasNoGroups, INACTIVE_MAP_MARKER_COLOR } from "@/lib/sites/map-colors";
import {
  MOSCOW_MAP_BOUNDS,
  positionSitesOnMap,
  projectUserLocationOnMap,
  type MapPercentPoint,
  type ProjectedUserLocation,
  siteHasMapLocation,
  type PositionedSiteOnMapPoint,
} from "@/lib/sites/map-projection";
import {
  getContainedMapRect,
  mapPercentPointToScreenPoint,
  type MapRenderRect,
} from "@/lib/sites/map-render";
import { PREFERRED_SCHOOL_STORAGE_KEY } from "@/lib/preferred-school";
import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import type { SiteScopeCard } from "@/lib/sites/scope-card";
import { pluralizeRuLabel } from "@/lib/i18n/pluralize-ru";
import { buildSiteHref } from "@/lib/sites/site-route";
import { cn } from "@/lib/utils";

type Props = {
  sites: SiteScopeCard[];
  visibleSites?: SiteScopeCard[];
  filterSlot?: ReactNode;
  mapColorMode?: "default" | "site";
  showList?: boolean;
};

type SetTransform = ReactZoomPanPinchRef["setTransform"];
type ResetTransform = ReactZoomPanPinchRef["resetTransform"];

type TransformState = {
  scale: number;
  positionX: number;
  positionY: number;
};

type DisplayMapPoint = PositionedSiteOnMapPoint & {
  screenX: number;
  screenY: number;
  visible: boolean;
};

type DisplayCluster =
  | {
      id: string;
      type: "point";
      point: DisplayMapPoint;
      screenX: number;
      screenY: number;
    }
  | {
      id: string;
      type: "cluster";
      points: DisplayMapPoint[];
      screenX: number;
      screenY: number;
    };

type UserLocation = ProjectedUserLocation & {
  accuracy: number;
};

const IDENTITY_TRANSFORM: TransformState = {
  scale: 1,
  positionX: 0,
  positionY: 0,
};

const DEFAULT_MAP_MARKER_COLOR = "#f97316";
const CLUSTER_DISTANCE = 36;
const MAP_ZOOM_LEVELS = [1, 2, 4, 8, 16] as const;
const WHEEL_ZOOM_COOLDOWN_MS = 260;

function nearestZoomLevel(scale: number): (typeof MAP_ZOOM_LEVELS)[number] {
  return MAP_ZOOM_LEVELS.reduce((nearest, level) =>
    Math.abs(level - scale) < Math.abs(nearest - scale) ? level : nearest,
  );
}

function nextZoomLevel(scale: number, direction: "in" | "out"): number {
  const currentLevel = nearestZoomLevel(scale);
  const currentIndex = MAP_ZOOM_LEVELS.indexOf(currentLevel);
  const nextIndex =
    direction === "in"
      ? Math.min(MAP_ZOOM_LEVELS.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

  return MAP_ZOOM_LEVELS[nextIndex];
}

function primaryMetro(site: SiteScopeCard): string | undefined {
  return site.campuses.find((campus) => campus.metro && campus.metro !== "—")?.metro;
}

function primaryAddress(site: SiteScopeCard): string {
  return site.campuses[0]?.address ?? site.locationLabel;
}

function rememberSite(site: SiteScopeCard) {
  localStorage.setItem(
    PREFERRED_SCHOOL_STORAGE_KEY,
    JSON.stringify({ slug: site.slug, name: site.name }),
  );
}

function buildDisplayPoints(params: {
  positionedPoints: PositionedSiteOnMapPoint[];
  visibleSiteSlugs: Set<string>;
  mapRect: MapRenderRect;
  transform: TransformState;
}): DisplayMapPoint[] {
  const { positionedPoints, visibleSiteSlugs, mapRect, transform } = params;
  return positionedPoints.map((point) => {
    const screenPoint = mapPercentPointToScreenPoint(point, mapRect, transform);

    return {
      ...point,
      screenX: screenPoint.x,
      screenY: screenPoint.y,
      visible: visibleSiteSlugs.has(point.site.slug),
    };
  });
}

function buildClusters(points: DisplayMapPoint[]): DisplayCluster[] {
  const clusters: DisplayCluster[] = [];
  const visited = new Set<string>();

  for (const point of points) {
    if (visited.has(point.id)) continue;

    const group = points.filter((candidate) => {
      if (visited.has(candidate.id)) return false;
      return Math.hypot(point.screenX - candidate.screenX, point.screenY - candidate.screenY) <= CLUSTER_DISTANCE;
    });

    for (const item of group) visited.add(item.id);

    if (group.length === 1) {
      clusters.push({
        id: point.id,
        type: "point",
        point,
        screenX: point.screenX,
        screenY: point.screenY,
      });
      continue;
    }

    clusters.push({
      id: group.map((item) => item.id).join("|"),
      type: "cluster",
      points: group,
      screenX: group.reduce((sum, item) => sum + item.screenX, 0) / group.length,
      screenY: group.reduce((sum, item) => sum + item.screenY, 0) / group.length,
    });
  }

  return clusters;
}

function getClusterMarkerColor(
  cluster: Extract<DisplayCluster, { type: "cluster" }>,
  mapColorMode: "default" | "site",
  siteColorBySlug: Map<string, string>,
): string {
  if (cluster.points.every(point => campusHasNoGroups(point.site, point.campus))) return INACTIVE_MAP_MARKER_COLOR;
  if (mapColorMode === "default") return DEFAULT_MAP_MARKER_COLOR;

  const firstSiteSlug = cluster.points[0]?.site.slug;
  if (!firstSiteSlug || cluster.points.some((point) => point.site.slug !== firstSiteSlug)) {
    return DEFAULT_MAP_MARKER_COLOR;
  }

  const firstPoint = cluster.points[0];
  return siteColorBySlug.get(firstSiteSlug) ?? (firstPoint ? getSiteMapColor(firstPoint.site) : DEFAULT_MAP_MARKER_COLOR);
}

function getMinimumClusterMapDistance(points: DisplayMapPoint[], mapRect: MapRenderRect): number {
  let minimumDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
      const point = points[index];
      const nextPoint = points[nextIndex];
      if (!point || !nextPoint) continue;
      const distance = Math.hypot(
        ((point.x - nextPoint.x) / 100) * mapRect.width,
        ((point.y - nextPoint.y) / 100) * mapRect.height,
      );
      minimumDistance = Math.min(minimumDistance, distance);
    }
  }

  return Number.isFinite(minimumDistance) ? minimumDistance : 0;
}

function getClusterSplitZoom(
  cluster: Extract<DisplayCluster, { type: "cluster" }>,
  mapRect: MapRenderRect,
  currentScale: number,
): number {
  const nextScale = nextZoomLevel(currentScale, "in");
  const minimumDistance = getMinimumClusterMapDistance(cluster.points, mapRect);
  const candidateLevels = MAP_ZOOM_LEVELS.filter((level) => level >= nextScale);

  return (
    candidateLevels.find((level) => minimumDistance * level > CLUSTER_DISTANCE) ??
    MAP_ZOOM_LEVELS[MAP_ZOOM_LEVELS.length - 1]
  );
}

function getClusterMapCenter(
  cluster: Extract<DisplayCluster, { type: "cluster" }>,
  mapRect: MapRenderRect,
): MapPercentPoint {
  const count = cluster.points.length || 1;
  return {
    x: mapRect.x + (cluster.points.reduce((sum, point) => sum + point.x, 0) / count / 100) * mapRect.width,
    y: mapRect.y + (cluster.points.reduce((sum, point) => sum + point.y, 0) / count / 100) * mapRect.height,
  };
}

function visiblePointsForList(points: DisplayMapPoint[]): DisplayMapPoint[] {
  return points.filter((point) => point.visible);
}

function groupPointsBySite(points: DisplayMapPoint[], orderedSites: SiteScopeCard[]): Array<{
  site: SiteScopeCard;
  points: DisplayMapPoint[];
}> {
  const grouped = new Map<string, { site: SiteScopeCard; points: DisplayMapPoint[] }>();
  for (const point of points) {
    const item = grouped.get(point.site.slug);
    if (item) {
      item.points.push(point);
    } else {
      grouped.set(point.site.slug, { site: point.site, points: [point] });
    }
  }
  const ordered = orderedSites
    .map((site) => grouped.get(site.slug))
    .filter((item): item is { site: SiteScopeCard; points: DisplayMapPoint[] } => Boolean(item));
  const orderedSlugs = new Set(ordered.map((item) => item.site.slug));
  const rest = Array.from(grouped.values()).filter((item) => !orderedSlugs.has(item.site.slug));

  return [...ordered, ...rest];
}

function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) return "~1 км";
  if (distanceKm < 10) return `~${distanceKm.toFixed(1).replace(".", ",")} км`;
  return `~${Math.round(distanceKm)} км`;
}

function MapPinMarker({
  point,
  active,
  preview,
  dimmed,
  mapColorMode,
  markerColor,
  onActivate,
  onDeactivate,
  onSelect,
}: {
  point: DisplayMapPoint;
  active: boolean;
  preview: boolean;
  dimmed: boolean;
  mapColorMode: "default" | "site";
  markerColor: string;
  onActivate: () => void;
  onDeactivate: () => void;
  onSelect: () => void;
}) {
  const metro = point.campus.metro && point.campus.metro !== "—" ? point.campus.metro : primaryMetro(point.site);
  const inactive = campusHasNoGroups(point.site, point.campus);
  const color = inactive ? INACTIVE_MAP_MARKER_COLOR : mapColorMode === "site" ? markerColor : DEFAULT_MAP_MARKER_COLOR;

  return (
    <div
      className={cn("pointer-events-none absolute z-10", active && "z-20")}
      style={{ left: point.screenX, top: point.screenY }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
    >
      <button
        type="button"
        className={cn(
          "pointer-events-auto -translate-x-1/2 -translate-y-1/2 relative flex size-5 cursor-pointer items-center justify-center rounded-full border-2 border-background transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          active || preview
            ? "scale-125 shadow-[0_0_0_8px_rgba(34,211,238,0.18),0_0_34px_rgba(34,211,238,0.55)]"
            : "shadow-[0_0_0_6px_rgba(255,255,255,0.08),0_0_18px_rgba(34,211,238,0.35)] hover:scale-110",
          dimmed && "opacity-35 saturate-50",
        )}
        data-map-interactive="true"
        data-campus-marker={point.campus.slug}
        data-inactive={inactive || undefined}
        style={{ backgroundColor: color }}
        aria-label={`${active ? inactive ? "Открыть информацию о площадке" : "Открыть расписание площадки" : "Выбрать площадку"} ${point.site.name}, ${point.campus.address}${metro ? `, метро ${metro}` : ""}${inactive ? ", сейчас нет групп" : ""}`}
        aria-pressed={active}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onClick={onSelect}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full opacity-55",
            !inactive && "motion-safe:animate-ping",
            active || preview ? "scale-125" : "",
          )}
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="pointer-events-none relative size-2 rounded-full bg-white" aria-hidden />
      </button>
    </div>
  );
}

function ClusterMarker({
  cluster,
  dimmed,
  markerColor,
  onSelect,
}: {
  cluster: Extract<DisplayCluster, { type: "cluster" }>;
  dimmed: boolean;
  markerColor: string;
  onSelect: () => void;
}) {
  const visibleCount = cluster.points.filter((point) => point.visible).length;

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ left: cluster.screenX, top: cluster.screenY }}
    >
      <button
        type="button"
        className={cn(
          "pointer-events-auto -translate-x-1/2 -translate-y-1/2 relative flex size-8 cursor-pointer items-center justify-center rounded-full border-2 bg-white font-heading font-bold text-sm transition duration-200 shadow-[0_0_0_6px_rgba(255,255,255,0.08),0_0_18px_rgba(34,211,238,0.35)] hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          dimmed && "opacity-35 saturate-50",
        )}
        data-map-interactive="true"
        data-testid="sites-map-cluster"
        data-inactive={cluster.points.every(point => campusHasNoGroups(point.site, point.campus)) || undefined}
        style={{ borderColor: markerColor, color: markerColor }}
        aria-label={`Группа из ${cluster.points.length} точек${visibleCount !== cluster.points.length ? `, найдено ${visibleCount}` : ""}`}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (event.detail === 0) onSelect();
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-55 motion-safe:animate-ping"
          style={{ backgroundColor: markerColor }}
          aria-hidden
        />
        <span className="pointer-events-none relative leading-none drop-shadow-sm">
          {cluster.points.length}
        </span>
      </button>
    </div>
  );
}

export function SitesMapSchematic(props: Props) {
  return <SiteMapCanvas {...props} showList={props.showList ?? true} />;
}

export function SiteMapCanvas({
  sites,
  visibleSites = sites,
  filterSlot,
  mapColorMode = "default",
  showList = false,
}: Props) {
  const router = useRouter();
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [previewPointId, setPreviewPointId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transform, setTransformState] = useState<TransformState>(IDENTITY_TRANSFORM);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const setTransformRef = useRef<SetTransform | null>(null);
  const resetTransformRef = useRef<ResetTransform | null>(null);
  const lastWheelZoomAtRef = useRef(0);
  const mappedSites = useMemo(() => sites.filter(siteHasMapLocation), [sites]);
  const visibleSiteSlugs = useMemo(
    () => new Set(visibleSites.filter(siteHasMapLocation).map((site) => site.slug)),
    [visibleSites],
  );
  const positionedPoints = useMemo(() => positionSitesOnMap(mappedSites), [mappedSites]);
  const siteColorBySlug = useMemo(() => buildSiteMapColorMap(mappedSites), [mappedSites]);
  const mapRect = useMemo(() => getContainedMapRect(frameSize), [frameSize]);
  const displayPoints = useMemo(
    () =>
      buildDisplayPoints({
        positionedPoints,
        visibleSiteSlugs,
        mapRect,
        transform,
      }),
    [mapRect, positionedPoints, transform, visibleSiteSlugs],
  );
  const visibleDisplayPoints = useMemo(() => visiblePointsForList(displayPoints), [displayPoints]);
  const listGroups = useMemo(
    () => groupPointsBySite(visibleDisplayPoints, visibleSites),
    [visibleDisplayPoints, visibleSites],
  );
  const displayClusters = useMemo(() => buildClusters(visibleDisplayPoints), [visibleDisplayPoints]);
  const activePoint = activePointId
    ? visibleDisplayPoints.find((point) => point.id === activePointId)
    : undefined;
  const activeSiteSlug = activePoint?.site.slug ?? null;

  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!frame) return;

    const updateSize = () => {
      const { width, height } = frame.getBoundingClientRect();
      setFrameSize({ width, height });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [isFullscreen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActivePointId(null);
        setPreviewPointId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function navigateToAgenda(site: SiteScopeCard) {
    rememberSite(site);
    router.push(`/sites/${site.slug}/agenda`);
  }

  function focusPoint(point: PositionedSiteOnMapPoint, setTransform: SetTransform, zoomOverride?: number) {
    const frame = mapFrameRef.current;
    if (!frame) return;

    const { width, height } = frame.getBoundingClientRect();
    const zoom = zoomOverride ?? (width < 640 ? 1.2 : 1.75);
    const currentMapRect = getContainedMapRect({ width, height });
    const positionX = width / 2 - (currentMapRect.x + (point.x / 100) * currentMapRect.width) * zoom;
    const positionY = height / 2 - (currentMapRect.y + (point.y / 100) * currentMapRect.height) * zoom;
    setTransform(positionX, positionY, zoom, 260, "easeOut");
  }

  function focusCluster(cluster: Extract<DisplayCluster, { type: "cluster" }>, setTransform: SetTransform) {
    const frame = mapFrameRef.current;
    if (!frame) return;

    const { width, height } = frame.getBoundingClientRect();
    const currentMapRect = getContainedMapRect({ width, height });
    const zoom = getClusterSplitZoom(cluster, currentMapRect, transform.scale);
    const splitsAtZoom = getMinimumClusterMapDistance(cluster.points, currentMapRect) * zoom > CLUSTER_DISTANCE;
    const center = getClusterMapCenter(cluster, currentMapRect);
    const positionX = width / 2 - center.x * zoom;
    const positionY = height / 2 - center.y * zoom;

    setTransform(positionX, positionY, zoom, 260, "easeOut");

    if (!splitsAtZoom) {
      const firstVisible = cluster.points.find((point) => point.visible) ?? cluster.points[0];
      setActivePointId(firstVisible?.id ?? null);
    } else {
      setActivePointId(null);
    }
  }

  function applyZoomLevel(targetScale: number, duration = 220) {
    const frame = mapFrameRef.current;
    const setTransform = setTransformRef.current;
    if (!frame || !setTransform || targetScale === transform.scale) return;

    const { width, height } = frame.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    const contentCenterX = (centerX - transform.positionX) / transform.scale;
    const contentCenterY = (centerY - transform.positionY) / transform.scale;
    const positionX = centerX - contentCenterX * targetScale;
    const positionY = centerY - contentCenterY * targetScale;

    setTransform(positionX, positionY, targetScale, duration, "easeOut");
  }

  function applyZoomStep(direction: "in" | "out") {
    if (direction === "out" && nearestZoomLevel(transform.scale) === MAP_ZOOM_LEVELS[0]) {
      resetTransformRef.current?.(220);
      return;
    }

    applyZoomLevel(nextZoomLevel(transform.scale, direction));
  }

  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!frame) return;
    const wheelFrame = frame;

    function handleMapWheel(event: WheelEvent) {
      if (Math.abs(event.deltaY) < 4) return;

      event.preventDefault();
      event.stopPropagation();

      const now = window.performance.now();
      if (now - lastWheelZoomAtRef.current < WHEEL_ZOOM_COOLDOWN_MS) return;
      lastWheelZoomAtRef.current = now;

      const direction = event.deltaY < 0 ? "in" : "out";
      if (direction === "out" && nearestZoomLevel(transform.scale) === MAP_ZOOM_LEVELS[0]) {
        resetTransformRef.current?.(220);
        return;
      }

      const targetScale = nextZoomLevel(transform.scale, direction);
      const setTransform = setTransformRef.current;
      if (!setTransform || targetScale === transform.scale) return;

      const rect = wheelFrame.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const contentX = (cursorX - transform.positionX) / transform.scale;
      const contentY = (cursorY - transform.positionY) / transform.scale;
      const positionX = cursorX - contentX * targetScale;
      const positionY = cursorY - contentY * targetScale;

      setTransform(positionX, positionY, targetScale, 220, "easeOut");
    }

    wheelFrame.addEventListener("wheel", handleMapWheel, { passive: false });
    return () => wheelFrame.removeEventListener("wheel", handleMapWheel);
  }, [transform]);

  function selectPoint(point: DisplayMapPoint) {
    if (activePointId === point.id) {
      if (campusHasNoGroups(point.site, point.campus)) router.push(buildSiteHref(point.site.slug));
      else navigateToAgenda(point.site);
      return;
    }

    setActivePointId(point.id);
    if (setTransformRef.current) {
      focusPoint(point, setTransformRef.current);
    }
  }

  function clearSelection() {
    setActivePointId(null);
    setPreviewPointId(null);
  }

  function maybeClearSelection(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("button,a,input,select,textarea,[data-map-interactive='true']")) return;
    clearSelection();
  }

  function showUserLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Геолокация недоступна в этом браузере.");
      return;
    }

    setLocationMessage("Определяем примерную область...");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const projectedLocation = projectUserLocationOnMap(latitude, longitude, MOSCOW_MAP_BOUNDS);

        setIsLocating(false);
        setUserLocation({ ...projectedLocation, accuracy });
        if (projectedLocation.status === "outside") {
          setLocationMessage(`Вы вне карты, примерно ${formatDistanceKm(projectedLocation.distanceKm)} от области.`);
          return;
        }

        setLocationMessage("Показана примерная область пользователя.");
      },
      () => {
        setIsLocating(false);
        setUserLocation(null);
        setLocationMessage("Не удалось получить доступ к геолокации.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  if (mappedSites.length === 0) {
    return (
      <div>
      {filterSlot}
      <div className="rounded-2xl border border-dashed border-white/15 bg-card/35 px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-foreground">
          Нет площадок по выбранным условиям
        </p>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground text-sm leading-relaxed">
          Измените поиск или сбросьте фильтры, чтобы увидеть площадки на карте.
        </p>
      </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-card/45 shadow-[0_24px_90px_rgba(2,6,23,0.28)]",
        !isFullscreen && showList && "lg:h-[min(78vh,42rem)] lg:min-h-0",
        showList && "lg:grid-cols-[minmax(0,1fr)_24rem]",
        isFullscreen &&
          cn(
            "fixed inset-0 z-[100] h-dvh rounded-none border-0 bg-background p-3",
            showList &&
              "grid-rows-[minmax(0,1fr)_minmax(14rem,40vh)] lg:grid-cols-[minmax(0,1fr)_26rem] lg:grid-rows-none",
          ),
      )}
    >
      <div
        className={cn(
          "relative min-h-[min(70vh,32rem)] bg-card/30",
          showList && "lg:min-h-0",
          isFullscreen && "min-h-0",
        )}
      >
        <div
          ref={mapFrameRef}
          data-testid="sites-map-frame"
          data-map-scale={nearestZoomLevel(transform.scale)}
          className={cn(
            "relative h-full min-h-[min(70vh,32rem)] overflow-hidden bg-card/20",
            showList && "lg:min-h-0",
            isFullscreen && "min-h-0",
            isFullscreen ? "rounded-2xl" : "lg:rounded-l-[1.75rem]",
          )}
          onClick={maybeClearSelection}
        >
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={16}
            centerOnInit
            limitToBounds={false}
            wheel={{ disabled: true }}
            doubleClick={{ mode: "zoomIn" }}
            panning={{ velocityDisabled: true }}
            onInit={(ref) =>
              setTransformState({
                scale: ref.state.scale,
                positionX: ref.state.positionX,
                positionY: ref.state.positionY,
              })
            }
            onTransform={(_, state) => setTransformState(state)}
          >
            {({ resetTransform, setTransform }) => {
              setTransformRef.current = setTransform;
              resetTransformRef.current = resetTransform;

              return (
                <>
                  <TransformComponent
                    wrapperClass="!h-full !w-full"
                    contentClass="!h-full !w-full"
                  >
                    <div className="relative size-full" data-testid="sites-map-content">
                      <MapBackground />
                    </div>
                  </TransformComponent>

                  <div className="pointer-events-none absolute inset-0 z-30">
                    {displayClusters.map((cluster) => {
                      if (cluster.type === "cluster") {
                        const hasActiveOrPreviewPoint = cluster.points.some(
                          (point) => point.id === activePointId || point.id === previewPointId,
                        );
                        const dimmed = Boolean(activePointId && !hasActiveOrPreviewPoint);
                        const markerColor = getClusterMarkerColor(cluster, mapColorMode, siteColorBySlug);
                        return (
                          <ClusterMarker
                            key={cluster.id}
                            cluster={cluster}
                            dimmed={dimmed}
                            markerColor={markerColor}
                            onSelect={() => focusCluster(cluster, setTransform)}
                          />
                        );
                      }

                      const point = cluster.point;
                      const active = activePointId === point.id;
                      const preview = previewPointId === point.id;
                      const dimmed = Boolean(activePointId && !active && !preview);

                      return (
                        <MapPinMarker
                          key={point.id}
                          point={point}
                          active={active}
                          preview={preview}
                          dimmed={dimmed}
                          mapColorMode={mapColorMode}
                          markerColor={siteColorBySlug.get(point.site.slug) ?? getSiteMapColor(point.site)}
                          onActivate={() => setPreviewPointId(point.id)}
                          onDeactivate={() => setPreviewPointId(null)}
                          onSelect={() => selectPoint(point)}
                        />
                      );
                    })}
                    <MapOverlay
                      points={visibleDisplayPoints}
                      activePointId={activePointId}
                      previewPointId={previewPointId}
                      frameSize={frameSize}
                      onOpenAgenda={navigateToAgenda}
                    />
                    {userLocation?.status === "inside" ? (
                      <UserLocationMarker
                        location={userLocation}
                        mapRect={mapRect}
                        transform={transform}
                      />
                    ) : null}
                    {userLocation?.status === "outside" ? (
                      <OutsideUserLocationMarker
                        location={userLocation}
                        mapRect={mapRect}
                        transform={transform}
                      />
                    ) : null}
                  </div>

                  <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5 rounded-full border border-white/10 bg-card/90 p-1 shadow-xl backdrop-blur">
                    <button
                      type="button"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-cyan-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label="Приблизить карту"
                      onClick={() => applyZoomStep("in")}
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-cyan-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label="Отдалить карту"
                      onClick={() => applyZoomStep("out")}
                    >
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-cyan-100 text-xs transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      onClick={() => resetTransform(220)}
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                      Сброс
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-cyan-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label={isFullscreen ? "Свернуть карту" : "Открыть карту на весь экран"}
                      onClick={() => setIsFullscreen((current) => !current)}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="size-4" aria-hidden />
                      ) : (
                        <Maximize2 className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "absolute right-3 bottom-3 z-40 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-cyan-200/25 bg-card/95 text-cyan-100 shadow-xl backdrop-blur transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                      isLocating && "animate-pulse cursor-wait text-cyan-200",
                    )}
                    aria-label="Показать моё местоположение"
                    aria-busy={isLocating}
                    title={locationMessage ?? "Показать моё местоположение"}
                    onClick={showUserLocation}
                  >
                    <LocateFixed className="size-5" aria-hidden />
                  </button>
                  {locationMessage ? (
                    <div className="absolute bottom-3 left-3 z-40 max-w-64 rounded-xl border border-white/10 bg-card/90 px-3 py-2 text-muted-foreground text-xs shadow-xl backdrop-blur">
                      {locationMessage}
                    </div>
                  ) : null}
                </>
              );
            }}
          </TransformWrapper>
        </div>
      </div>

      {showList ? (
      <aside className="bm-scrollbar flex min-h-0 flex-col gap-4 border-white/10 border-t bg-card/75 p-4 backdrop-blur-xl lg:h-full lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-lg text-foreground">
              Площадки
            </h3>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {visibleDisplayPoints.length} найдено на карте из {displayPoints.length}
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Navigation className="size-4" aria-hidden />
          </span>
        </div>

        {filterSlot ? <div className="shrink-0">{filterSlot}</div> : null}

        <SiteList
          groups={listGroups}
          activeSiteSlug={activeSiteSlug}
          previewPointId={previewPointId}
          onPreview={setPreviewPointId}
          onClear={clearSelection}
          onSelect={(point) => {
            if (activePointId === point.id) {
              clearSelection();
              return;
            }
            setActivePointId(point.id);
            if (setTransformRef.current) {
              focusPoint(point, setTransformRef.current);
            }
          }}
        />
      </aside>
      ) : null}
    </div>
  );
}

function MapBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl bg-card/20"
      role="img"
      aria-label="Кибер-карта Москвы с площадками BrainMaster"
    >
      <Image
        src="/sites/moscow-cyber-map.webp"
        alt=""
        fill
        className="object-contain object-center opacity-70 mix-blend-screen"
        sizes="(min-width: 1024px) 704px, calc(100vw - 2rem)"
      />
      <MapVignette />
    </div>
  );
}

function MapVignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_45%,rgba(15,23,42,0.38)_100%)]"
    />
  );
}

function SiteList({
  groups,
  activeSiteSlug,
  previewPointId,
  onPreview,
  onClear,
  onSelect,
}: {
  groups: Array<{ site: SiteScopeCard; points: DisplayMapPoint[] }>;
  activeSiteSlug: string | null;
  previewPointId: string | null;
  onPreview: (pointId: string | null) => void;
  onClear: () => void;
  onSelect: (point: DisplayMapPoint) => void;
}) {
  if (groups.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-white/15 bg-black/10 p-4 text-muted-foreground text-sm leading-relaxed"
        data-testid="sites-map-list-scroll"
      >
        По текущим фильтрам площадки не найдены. Карта остаётся на месте, чтобы можно
        было изменить поиск или сбросить фильтры.
      </div>
    );
  }

  return (
    <div
      className="grid min-h-32 flex-1 gap-3 overflow-y-auto pr-1 lg:min-h-0"
      data-testid="sites-map-list-scroll"
    >
      {groups.map(({ site, points }) => {
        const metro = primaryMetro(site);
        const active = activeSiteSlug === site.slug;
        const preview = points.some((point) => previewPointId === point.id);
        const primaryPoint = points[0];
        if (!primaryPoint) return null;

        return (
          <article
            key={site.slug}
            data-site={site.slug} data-inactive={site.shiftCount === 0 || undefined}
            className={cn(
              "group rounded-2xl border bg-black/10 text-left transition",
              site.shiftCount === 0 && "grayscale",
              active || preview
                ? "border-orange-400/60 shadow-[0_0_28px_rgba(234,88,12,0.18)]"
                : "border-white/10 hover:border-orange-300/30",
            )}
          >
            <div className="flex gap-3 p-3">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-white/40">
                <SiteLogo site={site} />
              </div>
              <div
                className="min-w-0 flex-1 text-left"
                onMouseEnter={() => onPreview(primaryPoint.id)}
                onMouseLeave={() => onPreview(null)}
                onFocus={() => onPreview(primaryPoint.id)}
                onBlur={() => onPreview(null)}
              >
                <Link
                  href={buildSiteHref(site.slug)}
                  className="block truncate rounded-sm font-medium text-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => rememberSite(site)}
                >
                  {site.name}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground text-xs leading-relaxed">
                  {metro ? <MetroLabel metro={metro} /> : <span>{site.locationSummary}</span>}
                  {points.length > 1 ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{pluralizeRuLabel(points.length, ["корпус", "корпуса", "корпусов"])}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-white/10 px-2.5 text-primary text-xs transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={active}
                onClick={() => (active ? onClear() : onSelect(primaryPoint))}
              >
                {active ? "Скрыть" : "Детали"}
                <ArrowRight
                  className={cn("size-3.5 transition", active ? "rotate-90" : "group-hover:translate-x-0.5")}
                  aria-hidden
                />
              </button>
            </div>

            {active ? <SelectedSiteDetails site={site} points={points} /> : null}
          </article>
        );
      })}
    </div>
  );
}

function MapOverlay({
  points,
  activePointId,
  previewPointId,
  frameSize,
  onOpenAgenda,
}: {
  points: DisplayMapPoint[];
  activePointId: string | null;
  previewPointId: string | null;
  frameSize: { width: number; height: number };
  onOpenAgenda: (site: SiteScopeCard) => void;
}) {
  const previewPoint = points.find((point) => point.id === previewPointId && point.id !== activePointId);
  const activePoint = points.find((point) => point.id === activePointId);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {previewPoint ? <MapTooltip point={previewPoint} selected={false} /> : null}
      {activePoint ? (
        <MapTooltip
          point={activePoint}
          selected
          frameSize={frameSize}
          onOpenAgenda={() => onOpenAgenda(activePoint.site)}
        />
      ) : null}
    </div>
  );
}

function MapTooltip({
  point,
  selected,
  frameSize,
  onOpenAgenda,
}: {
  point: DisplayMapPoint;
  selected: boolean;
  frameSize?: { width: number; height: number };
  onOpenAgenda?: () => void;
}) {
  const metro = point.campus.metro && point.campus.metro !== "—" ? point.campus.metro : primaryMetro(point.site);
  const className = cn(
    "absolute w-max max-w-64 rounded-xl border border-orange-500/45 bg-card/95 px-3 py-2 text-left shadow-[0_18px_70px_rgba(234,88,12,0.2)] backdrop-blur-xl",
    selected
      ? "-translate-x-1/2 max-sm:w-auto max-sm:max-w-none max-sm:translate-x-0"
      : "top-6 left-1/2 -translate-x-1/2",
    selected && "pointer-events-auto cursor-pointer border-cyan-300/50",
  );
  const style =
    selected && frameSize?.width && frameSize.width < 640
      ? { right: 12, bottom: 12, left: 12 }
      : {
          left:
            selected && frameSize?.width
              ? Math.min(frameSize.width - 132, Math.max(132, point.screenX))
              : point.screenX,
          top:
            selected && frameSize?.height
              ? Math.min(frameSize.height - 112, Math.max(40, point.screenY + 28))
              : point.screenY,
        };
  const content = (
    <>
      <Link
        href={buildSiteHref(point.site.slug)}
        className="block rounded-sm font-semibold text-sm text-white transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => rememberSite(point.site)}
      >
        {point.site.name}
      </Link>
      <p className="mt-0.5 text-orange-300 text-xs leading-relaxed">{point.campus.headline}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-cyan-100/90 text-xs leading-relaxed">
        {metro ? <MetroLabel metro={metro} /> : <span>{point.site.locationSummary}</span>}
      </p>
      {selected ? (
        <span
          className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-cyan-200/70 max-sm:hidden"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (selected) {
    return (
      <div
        className={className}
        style={style}
      >
        {content}
        {campusHasNoGroups(point.site, point.campus) ? (
          <Link
            href={buildSiteHref(point.site.slug)}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-2.5 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => rememberSite(point.site)}
          >
            О площадке · в этом корпусе пока нет групп
          </Link>
        ) : <button
          type="button"
          className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 font-medium text-cyan-50 text-xs transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Открыть расписание выбранной площадки ${point.site.name}`}
          onClick={onOpenAgenda}
        >
          Открыть расписание
        </button>}
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

function UserLocationMarker({
  location,
  mapRect,
  transform,
}: {
  location: Extract<UserLocation, { status: "inside" }>;
  mapRect: MapRenderRect;
  transform: TransformState;
}) {
  const { x: screenX, y: screenY } = mapPercentPointToScreenPoint(location.point, mapRect, transform);
  const radius = Math.min(80, Math.max(18, location.accuracy / 45)) * transform.scale;

  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: screenX, top: screenY }}
      aria-hidden
    >
      <span
        className="absolute rounded-full border border-cyan-200/35 bg-cyan-300/10"
        style={{
          width: radius * 2,
          height: radius * 2,
          left: -radius,
          top: -radius,
        }}
      />
      <span className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-cyan-300 shadow-[0_0_26px_rgba(103,232,249,0.65)]" />
    </div>
  );
}

function OutsideUserLocationMarker({
  location,
  mapRect,
  transform,
}: {
  location: Extract<UserLocation, { status: "outside" }>;
  mapRect: MapRenderRect;
  transform: TransformState;
}) {
  const { x: screenX, y: screenY } = mapPercentPointToScreenPoint(location.point, mapRect, transform);

  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: screenX, top: screenY }}
      aria-hidden
    >
      <span className="absolute -inset-3 rounded-full border border-dashed border-cyan-200/40 bg-slate-950/55 shadow-[0_0_30px_rgba(103,232,249,0.18)]" />
      <span
        className="absolute -left-2 -top-2 inline-flex size-4 items-center justify-center text-cyan-200"
        style={{ transform: `rotate(${location.directionDegrees}deg)` }}
      >
        <ArrowRight className="size-4" aria-hidden />
      </span>
      <span className="absolute left-4 top-2 w-max rounded-lg border border-white/10 bg-card/95 px-2 py-1 text-cyan-50 text-xs shadow-xl">
        Вы вне карты · {formatDistanceKm(location.distanceKm)}
      </span>
    </div>
  );
}

function SiteLogo({ site }: { site: SiteScopeCard }) {
  const logoSrc = resolvePublicMediaUrl(site.logoUrl);
  if (logoSrc) {
    return (
      <Image
        src={logoSrc}
        alt=""
        width={56}
        height={56}
        className="size-full object-contain"
      />
    );
  }

  return <Navigation className="size-6 text-slate-950" aria-hidden />;
}

function SelectedSiteDetails({ site, points }: { site: SiteScopeCard; points: DisplayMapPoint[] }) {
  return (
    <div className="border-white/10 border-t p-3 pt-4">
      <div className="grid gap-2 text-sm">
        <p className="flex gap-2 rounded-xl border border-white/10 bg-black/15 p-3 text-foreground leading-relaxed">
          <LocateFixed className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>{primaryAddress(site)}</span>
        </p>

        {points.length > 1 ? (
          <div className="grid gap-1.5 rounded-xl border border-white/10 bg-black/15 p-3">
            {points.map((point) => (
              <p key={point.id} className="text-muted-foreground text-xs leading-relaxed">
                <span className="font-medium text-foreground">{point.campus.headline}</span>
                {point.campus.metro && point.campus.metro !== "—" ? (
                  <>
                    <span aria-hidden> · </span>
                    <MetroLabel metro={point.campus.metro} />
                  </>
                ) : null}
              </p>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
            <p className="font-heading text-xl font-semibold text-foreground">{site.courseCount}</p>
            <p className="text-muted-foreground text-xs">курсов</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
            <p className="font-heading text-xl font-semibold text-foreground">{site.shiftCount}</p>
            <p className="text-muted-foreground text-xs">групп</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {site.shiftCount === 0 ? <>
          <p className="text-muted-foreground text-sm">На этой площадке пока нет групп.</p>
          <Link href={buildSiteHref(site.slug)} className={buttonVariants({ variant: "outline", size: "sm" })} onClick={() => rememberSite(site)}>О площадке</Link>
        </> : <>
        <Link
          href={`/sites/${site.slug}/agenda`}
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
          onClick={() => rememberSite(site)}
        >
          <CalendarDays className="size-4" aria-hidden />
          Посмотреть расписание площадки
        </Link>
        <Link
          href={`/sites/${site.slug}/catalog`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2 border-white/10 bg-transparent hover:bg-white/5",
          )}
          onClick={() => rememberSite(site)}
        >
          <Grid2X2 className="size-4" aria-hidden />
          Доступные курсы
        </Link>
        </>}
      </div>
    </div>
  );
}
