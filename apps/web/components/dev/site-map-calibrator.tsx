"use client";

import Image from "next/image";
import { Copy, Download, MapPin, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CITY_META } from "@/lib/sites/city-card";
import {
  SITE_MAP_CALIBRATIONS,
  type SiteMapCalibrationConfig,
  type MapGeoControlPoint,
} from "@/lib/sites/map-calibration";
import { positionSitesOnMap, type PositionedSiteOnMapPoint } from "@/lib/sites/map-projection";
import type { SiteScopeCard } from "@/lib/sites/scope-card";
import { cn } from "@/lib/utils";

type Props = {
  sites: SiteScopeCard[];
};

type CalibrationPoint = {
  x: number;
  y: number;
};

type CalibratorMode = "sites" | "geo";

type SetTransform = ReactZoomPanPinchRef["setTransform"];
type ResetTransform = ReactZoomPanPinchRef["resetTransform"];

type TransformState = {
  scale: number;
  positionX: number;
  positionY: number;
};

type PointerStart = {
  x: number;
  y: number;
};

const IDENTITY_TRANSFORM: TransformState = {
  scale: 1,
  positionX: 0,
  positionY: 0,
};

const CALIBRATOR_ZOOM_LEVELS = [1, 2, 4, 8, 16, 32] as const;
const WHEEL_ZOOM_COOLDOWN_MS = 220;
const MAP_CLICK_DRAG_THRESHOLD_PX = 6;
const DEFAULT_MAP_CALIBRATION = SITE_MAP_CALIBRATIONS[0] satisfies SiteMapCalibrationConfig;
const MAP_CALIBRATIONS_BY_CITY = new Map<string, SiteMapCalibrationConfig>(
  SITE_MAP_CALIBRATIONS.map((calibration) => [calibration.city, calibration]),
);

function clampPoint(value: number): number {
  return Math.min(98, Math.max(2, Number(value.toFixed(2))));
}

function nearestZoomLevel(scale: number): (typeof CALIBRATOR_ZOOM_LEVELS)[number] {
  return CALIBRATOR_ZOOM_LEVELS.reduce((nearest, level) =>
    Math.abs(level - scale) < Math.abs(nearest - scale) ? level : nearest,
  );
}

function nextZoomLevel(scale: number, direction: "in" | "out"): number {
  const currentLevel = nearestZoomLevel(scale);
  const currentIndex = CALIBRATOR_ZOOM_LEVELS.indexOf(currentLevel);
  const nextIndex =
    direction === "in"
      ? Math.min(CALIBRATOR_ZOOM_LEVELS.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

  return CALIBRATOR_ZOOM_LEVELS[nextIndex];
}

function formatCalibration(points: Record<string, CalibrationPoint>): string {
  const ordered = Object.entries(points).sort(([a], [b]) => a.localeCompare(b, "ru"));
  const body = ordered
    .map(([slug, point]) => `  "${slug}": { x: ${point.x}, y: ${point.y} },`)
    .join("\n");

  return `export const SITE_MAP_POINTS = {\n${body}\n} as const satisfies Record<string, { x: number; y: number }>;`;
}

function formatGeoControlPoints(points: MapGeoControlPoint[]): string {
  const body = points
    .map(
      (point) =>
        `  { x: ${point.x}, y: ${point.y}, latitude: ${point.latitude}, longitude: ${point.longitude} },`,
    )
    .join("\n");

  return `export const MAP_GEO_CONTROL_POINTS = [\n${body}\n] as const satisfies readonly MapGeoControlPoint[];`;
}

function buildInitialPoints(positionedPoints: PositionedSiteOnMapPoint[]): Record<string, CalibrationPoint> {
  return Object.fromEntries(
    positionedPoints.map((positioned) => [
      positioned.calibrationKey,
      { x: positioned.x, y: positioned.y },
    ]),
  ) as Record<string, CalibrationPoint>;
}

export function SiteMapCalibrator({ sites }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const setTransformRef = useRef<SetTransform | null>(null);
  const resetTransformRef = useRef<ResetTransform | null>(null);
  const lastWheelZoomAtRef = useRef(0);
  const mapPointerStartRef = useRef<PointerStart | null>(null);
  const suppressNextMapClickRef = useRef(false);
  const mapOptions = useMemo(
    () =>
      Object.values(CITY_META)
        .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.label.localeCompare(b.label, "ru"))
        .map((city) => ({
          city: city.slug,
          label: city.label,
          calibration: MAP_CALIBRATIONS_BY_CITY.get(city.slug),
        })),
    [],
  );
  const [selectedCity, setSelectedCity] = useState<string>(DEFAULT_MAP_CALIBRATION.city);
  const selectedMap = MAP_CALIBRATIONS_BY_CITY.get(selectedCity) ?? DEFAULT_MAP_CALIBRATION;
  const selectedSites = useMemo(
    () => sites.filter((site) => site.city === selectedMap.city),
    [selectedMap.city, sites],
  );
  const positionedPoints = useMemo(() => positionSitesOnMap(selectedSites), [selectedSites]);
  const initialPoints = useMemo(
    () => buildInitialPoints(positionedPoints),
    [positionedPoints],
  );
  const [points, setPoints] = useState(initialPoints);
  const [activeKey, setActiveKey] = useState(positionedPoints[0]?.calibrationKey ?? null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [mode, setMode] = useState<CalibratorMode>("sites");
  const [geoControlPoints, setGeoControlPoints] = useState<MapGeoControlPoint[]>([
    ...selectedMap.geoControlPoints,
  ]);
  const [activeGeoIndex, setActiveGeoIndex] = useState(0);
  const [draggingGeoIndex, setDraggingGeoIndex] = useState<number | null>(null);
  const [draftGeoPoint, setDraftGeoPoint] = useState({ latitude: 55.75, longitude: 37.62 });
  const [transform, setTransformState] = useState<TransformState>(IDENTITY_TRANSFORM);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const exportText = formatCalibration(points);
  const geoExportText = formatGeoControlPoints(geoControlPoints);
  const exportBundleText = `${exportText}\n\n${geoExportText}`;

  useEffect(() => {
    const frame = mapRef.current;
    if (!frame) return;

    const updateSize = () => {
      const { width, height } = frame.getBoundingClientRect();
      setFrameSize({ width, height });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = mapRef.current;
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
      if (direction === "out" && nearestZoomLevel(transform.scale) === CALIBRATOR_ZOOM_LEVELS[0]) {
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

  function updatePointFromPointer(key: string, clientX: number, clientY: number) {
    const point = getPointFromPointer(clientX, clientY);
    if (!point) return;

    setPoints((current) => ({ ...current, [key]: point }));
  }

  function trackMapPointerDown(clientX: number, clientY: number) {
    mapPointerStartRef.current = { x: clientX, y: clientY };
    suppressNextMapClickRef.current = false;
  }

  function trackMapPointerMove(clientX: number, clientY: number) {
    const start = mapPointerStartRef.current;
    if (!start) return;

    if (Math.hypot(clientX - start.x, clientY - start.y) > MAP_CLICK_DRAG_THRESHOLD_PX) {
      suppressNextMapClickRef.current = true;
    }
  }

  function resetMapPointerTracking() {
    mapPointerStartRef.current = null;
  }

  function getPointFromPointer(clientX: number, clientY: number): CalibrationPoint | null {
    const frame = mapRef.current;
    if (!frame) return null;

    const rect = frame.getBoundingClientRect();
    const contentX = (clientX - rect.left - transform.positionX) / transform.scale;
    const contentY = (clientY - rect.top - transform.positionY) / transform.scale;

    return {
      x: clampPoint((contentX / rect.width) * 100),
      y: clampPoint((contentY / rect.height) * 100),
    };
  }

  function getScreenPoint(point: CalibrationPoint): CalibrationPoint {
    return {
      x: transform.positionX + (point.x / 100) * frameSize.width * transform.scale,
      y: transform.positionY + (point.y / 100) * frameSize.height * transform.scale,
    };
  }

  function applyZoomLevel(targetScale: number, duration = 220) {
    const frame = mapRef.current;
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
    if (direction === "out" && nearestZoomLevel(transform.scale) === CALIBRATOR_ZOOM_LEVELS[0]) {
      resetTransformRef.current?.(220);
      return;
    }

    applyZoomLevel(nextZoomLevel(transform.scale, direction));
  }

  function changeSelectedCity(city: string | null) {
    if (!city) return;
    const nextMap = MAP_CALIBRATIONS_BY_CITY.get(city);
    if (!nextMap) return;
    const nextPositionedPoints = positionSitesOnMap(sites.filter((site) => site.city === nextMap.city));

    setSelectedCity(city);
    setPoints(buildInitialPoints(nextPositionedPoints));
    setActiveKey(nextPositionedPoints[0]?.calibrationKey ?? null);
    setGeoControlPoints([...nextMap.geoControlPoints]);
    setActiveGeoIndex(0);
    setDraggingKey(null);
    setDraggingGeoIndex(null);
    resetTransformRef.current?.(0);
  }

  function deleteGeoControlPoint(index: number) {
    setGeoControlPoints((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveGeoIndex((current) => {
      const lastNextIndex = Math.max(0, geoControlPoints.length - 2);
      if (current > index) return current - 1;
      return Math.min(current, lastNextIndex);
    });
    setDraggingGeoIndex(null);
  }

  function addGeoControlPoint(clientX: number, clientY: number) {
    const point = getPointFromPointer(clientX, clientY);
    if (!point) return;

    setGeoControlPoints((current) => {
      const next = [...current, { ...point, ...draftGeoPoint }];
      setActiveGeoIndex(next.length - 1);
      return next;
    });
  }

  function updateGeoControlPointFromPointer(index: number, clientX: number, clientY: number) {
    const point = getPointFromPointer(clientX, clientY);
    if (!point) return;

    setGeoControlPoints((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...point } : item)),
    );
  }

  function updateGeoControlCoordinate(
    index: number,
    key: "latitude" | "longitude",
    value: string,
  ) {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) return;

    setGeoControlPoints((current) =>
      current.map((point, itemIndex) =>
        itemIndex === index ? { ...point, [key]: nextValue } : point,
      ),
    );
  }

  async function copyCalibration() {
    await navigator.clipboard.writeText(exportBundleText);
  }

  function downloadCalibration() {
    const blob = new Blob([exportBundleText], { type: "text/typescript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "map-calibration.ts";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="rounded-[1.75rem] border border-white/10 bg-card/45 p-4 shadow-[0_24px_90px_rgba(2,6,23,0.28)] sm:p-6">
        <div
          ref={mapRef}
          data-testid="calibrator-map-frame"
          data-map-scale={nearestZoomLevel(transform.scale)}
          className="relative aspect-square min-h-80 overflow-hidden rounded-2xl bg-card/20 touch-none"
          onPointerDown={(event) => {
            trackMapPointerDown(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            trackMapPointerMove(event.clientX, event.clientY);
            if (mode === "sites" && draggingKey) {
              updatePointFromPointer(draggingKey, event.clientX, event.clientY);
            }
            if (mode === "geo" && draggingGeoIndex !== null) {
              updateGeoControlPointFromPointer(draggingGeoIndex, event.clientX, event.clientY);
            }
          }}
          onPointerUp={() => {
            setDraggingKey(null);
            setDraggingGeoIndex(null);
            resetMapPointerTracking();
          }}
          onPointerCancel={() => {
            setDraggingKey(null);
            setDraggingGeoIndex(null);
            suppressNextMapClickRef.current = true;
            resetMapPointerTracking();
          }}
          onClick={(event) => {
            if (mode !== "geo") return;
            const target = event.target;
            if (target instanceof Element && target.closest("button,a,input,select,textarea")) return;
            if (suppressNextMapClickRef.current) {
              suppressNextMapClickRef.current = false;
              return;
            }
            addGeoControlPoint(event.clientX, event.clientY);
          }}
        >
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={32}
            centerOnInit
            limitToBounds={false}
            wheel={{ disabled: true }}
            doubleClick={{ disabled: true }}
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
                    <div className="relative size-full" data-testid="calibrator-map-content">
                      <Image
                        src={selectedMap.imageSrc}
                        alt=""
                        fill
                        className="object-contain object-center opacity-70 mix-blend-screen"
                        sizes="(min-width: 1024px) 800px, calc(100vw - 2rem)"
                        priority
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_45%,rgba(15,23,42,0.38)_100%)]"
                      />
                    </div>
                  </TransformComponent>

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
                  </div>
                </>
              );
            }}
          </TransformWrapper>

          {mode === "sites" ? positionedPoints.map((positioned) => {
            const point = points[positioned.calibrationKey] ?? { x: positioned.x, y: positioned.y };
            const screenPoint = getScreenPoint(point);
            const active = activeKey === positioned.calibrationKey;

            return (
              <button
                key={positioned.id}
                type="button"
                className={cn(
                  "absolute z-20 size-12 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border bg-slate-950/60 text-xs shadow-xl backdrop-blur transition hover:bg-slate-950/80 active:cursor-grabbing",
                  active
                    ? "border-orange-300 text-orange-100 shadow-[0_0_0_6px_rgba(251,146,60,0.14),0_0_32px_rgba(251,146,60,0.5)]"
                    : "border-orange-200/35 text-orange-100/85 hover:border-orange-200/70",
                )}
                style={{ left: screenPoint.x, top: screenPoint.y }}
                aria-label={`Точка площадки ${formatPointLabel(positioned)}`}
                data-testid="calibrator-site-crosshair"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setActiveKey(positioned.calibrationKey);
                  setDraggingKey(positioned.calibrationKey);
                  updatePointFromPointer(positioned.calibrationKey, event.clientX, event.clientY);
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <span
                  className="pointer-events-none absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-orange-100/85"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-orange-100/85"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-2 rounded-full border border-orange-100/70"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-50 shadow-[0_0_12px_rgba(255,247,237,0.9)]"
                  aria-hidden
                />
                <span className="pointer-events-none absolute top-full left-1/2 mt-1 max-w-48 -translate-x-1/2 truncate rounded-full border border-orange-200/30 bg-slate-950/85 px-1.5 py-0.5 text-[10px] text-orange-50">
                  {formatPointLabel(positioned)}
                </span>
              </button>
            );
          }) : null}
          {mode === "geo" ? geoControlPoints.map((point, index) => {
            const screenPoint = getScreenPoint(point);
            const active = activeGeoIndex === index;

            return (
              <button
                key={`${point.latitude}:${point.longitude}:${index}`}
                type="button"
                className={cn(
                  "absolute z-20 size-12 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border bg-slate-950/55 text-xs shadow-xl backdrop-blur transition hover:bg-slate-950/75 active:cursor-grabbing",
                  active
                    ? "border-cyan-200 text-cyan-100 shadow-[0_0_0_6px_rgba(34,211,238,0.14),0_0_32px_rgba(34,211,238,0.5)]"
                    : "border-cyan-200/35 text-cyan-100/80 hover:border-cyan-200/70",
                )}
                style={{ left: screenPoint.x, top: screenPoint.y }}
                aria-label={`Geo ${index + 1}: контрольная точка карты`}
                data-testid="calibrator-geo-crosshair"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setActiveGeoIndex(index);
                  setDraggingGeoIndex(index);
                  updateGeoControlPointFromPointer(index, event.clientX, event.clientY);
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <span
                  className="pointer-events-none absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-cyan-100/85"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-cyan-100/85"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-2 rounded-full border border-cyan-100/70"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-50 shadow-[0_0_12px_rgba(236,254,255,0.9)]"
                  aria-hidden
                />
                <span className="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-cyan-200/30 bg-slate-950/85 px-1.5 py-0.5 text-[10px] text-cyan-50">
                  Geo {index + 1}
                </span>
              </button>
            );
          }) : null}
        </div>
      </section>

      <aside className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-card/45 p-4 backdrop-blur-md">
        <div>
          <h2 className="font-heading text-xl font-semibold">Точки</h2>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
            Значения сохраняются только в браузере. Для фиксации скопируйте объекты в файл
            калибровки.
          </p>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Карта / город</span>
          <Select value={selectedMap.city} onValueChange={changeSelectedCity}>
            <SelectTrigger
              data-testid="calibrator-map-selector"
              className="w-full border-white/10 bg-black/20"
              aria-label="Карта / город"
            >
              <span>{selectedMap.label}</span>
            </SelectTrigger>
            <SelectContent>
              {mapOptions.map((option) => (
                <SelectItem
                  key={option.city}
                  value={option.city}
                  disabled={!option.calibration}
                >
                  {option.label}
                  {!option.calibration ? " · карта ещё не добавлена" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-xs">
            Сейчас калибруется {selectedMap.label}. Города без подложки недоступны для выбора.
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/15 p-1">
          <button
            type="button"
            className={cn(
              "rounded-xl px-3 py-2 text-sm transition",
              mode === "sites" ? "bg-white/[0.12] text-foreground" : "text-muted-foreground hover:bg-white/[0.06]",
            )}
            aria-pressed={mode === "sites"}
            onClick={() => setMode("sites")}
          >
            Площадки
          </button>
          <button
            type="button"
            className={cn(
              "rounded-xl px-3 py-2 text-sm transition",
              mode === "geo" ? "bg-white/[0.12] text-foreground" : "text-muted-foreground hover:bg-white/[0.06]",
            )}
            aria-pressed={mode === "geo"}
            onClick={() => setMode("geo")}
          >
            Geo-точки
          </button>
        </div>

        {mode === "sites" ? (
          <div className="max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/15 p-2">
            {positionedPoints.map((positioned) => {
            const point = points[positioned.calibrationKey] ?? { x: positioned.x, y: positioned.y };
            const active = activeKey === positioned.calibrationKey;

            return (
              <button
                key={positioned.id}
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                  active ? "bg-orange-500/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.06]",
                )}
                onClick={() => setActiveKey(positioned.calibrationKey)}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{formatPointLabel(positioned)}</span>
                  <span className="block truncate text-muted-foreground text-[11px]">
                    {positioned.calibrationKey}
                  </span>
                  <span className="block text-xs">
                    x: {point.x}, y: {point.y}
                  </span>
                </span>
              </button>
            );
            })}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/15 p-3">
              <p className="text-muted-foreground text-xs leading-relaxed">
                Впишите известные координаты, затем кликните по соответствующей точке на
                изображении. Прицел ставится по центру, зум доступен до 32x. Три и более
                точки включат affine-привязку.
              </p>
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Latitude</span>
                <input
                  type="number"
                  step="0.000001"
                  value={draftGeoPoint.latitude}
                  onChange={(event) =>
                    setDraftGeoPoint((current) => ({
                      ...current,
                      latitude: Number(event.target.value),
                    }))
                  }
                  className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Longitude</span>
                <input
                  type="number"
                  step="0.000001"
                  value={draftGeoPoint.longitude}
                  onChange={(event) =>
                    setDraftGeoPoint((current) => ({
                      ...current,
                      longitude: Number(event.target.value),
                    }))
                  }
                  className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </div>

            <div className="max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/15 p-2">
              {geoControlPoints.length === 0 ? (
                <p className="p-3 text-muted-foreground text-sm">
                  Geo-точек пока нет. Кликните по карте, чтобы добавить первую.
                </p>
              ) : null}
              {geoControlPoints.map((point, index) => {
                const active = activeGeoIndex === index;

                return (
                  <div
                    key={`${point.latitude}:${point.longitude}:${index}`}
                    className={cn(
                      "grid gap-2 rounded-xl p-3 text-sm transition",
                      active ? "bg-cyan-500/15 text-foreground" : "text-muted-foreground",
                    )}
                    onClick={() => setActiveGeoIndex(index)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="inline-flex min-w-0 cursor-pointer items-center gap-1 rounded-lg text-left font-medium text-foreground transition hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setActiveGeoIndex(index)}
                      >
                        Geo {index + 1}
                      </button>
                      <span className="text-xs">x: {point.x}, y: {point.y}</span>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 cursor-pointer gap-2 border-red-300/20 bg-transparent text-red-100 hover:bg-red-500/10",
                      )}
                      aria-label={`Удалить Geo ${index + 1}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteGeoControlPoint(index);
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Удалить
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="grid gap-1 text-xs">
                        <span>Lat</span>
                        <input
                          type="number"
                          step="0.000001"
                          value={point.latitude}
                          onChange={(event) =>
                            updateGeoControlCoordinate(index, "latitude", event.target.value)
                          }
                          className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                      <label className="grid gap-1 text-xs">
                        <span>Lon</span>
                        <input
                          type="number"
                          step="0.000001"
                          value={point.longitude}
                          onChange={(event) =>
                            updateGeoControlCoordinate(index, "longitude", event.target.value)
                          }
                          className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
              onClick={copyCalibration}
            >
              <Copy className="size-4" aria-hidden />
              Copy JSON
            </button>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2 border-white/10 bg-transparent hover:bg-white/5",
              )}
              onClick={downloadCalibration}
            >
              <Download className="size-4" aria-hidden />
              Download JSON
            </button>
          </div>
          <textarea
            readOnly
            value={exportText}
            className="min-h-72 rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-cyan-50 text-xs outline-none"
            aria-label="Экспорт координат карты"
          />
          <textarea
            readOnly
            value={geoExportText}
            className="min-h-48 rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-cyan-50 text-xs outline-none"
            aria-label="Экспорт geo-точек карты"
          />
        </div>
      </aside>
    </div>
  );
}

function formatPointLabel(point: PositionedSiteOnMapPoint): string {
  if (point.site.campusCount <= 1) return point.site.name;

  return `${point.site.name} · ${point.campus.name}`;
}
