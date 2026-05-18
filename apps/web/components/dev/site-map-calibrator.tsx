"use client";

import Image from "next/image";
import { Download, Grip, MapPin, Copy } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  MAP_GEO_CONTROL_POINTS,
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

function clampPoint(value: number): number {
  return Math.min(98, Math.max(2, Number(value.toFixed(2))));
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

export function SiteMapCalibrator({ sites }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const positionedPoints = useMemo(() => positionSitesOnMap(sites), [sites]);
  const initialPoints = useMemo(
    () =>
      Object.fromEntries(
        positionedPoints.map((positioned) => [
          positioned.calibrationKey,
          { x: positioned.x, y: positioned.y },
        ]),
      ) as Record<string, CalibrationPoint>,
    [positionedPoints],
  );
  const [points, setPoints] = useState(initialPoints);
  const [activeKey, setActiveKey] = useState(positionedPoints[0]?.calibrationKey ?? null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [mode, setMode] = useState<CalibratorMode>("sites");
  const [geoControlPoints, setGeoControlPoints] = useState<MapGeoControlPoint[]>([
    ...MAP_GEO_CONTROL_POINTS,
  ]);
  const [activeGeoIndex, setActiveGeoIndex] = useState(0);
  const [draggingGeoIndex, setDraggingGeoIndex] = useState<number | null>(null);
  const [draftGeoPoint, setDraftGeoPoint] = useState({ latitude: 55.75, longitude: 37.62 });
  const exportText = formatCalibration(points);
  const geoExportText = formatGeoControlPoints(geoControlPoints);
  const exportBundleText = `${exportText}\n\n${geoExportText}`;

  function updatePointFromPointer(key: string, clientX: number, clientY: number) {
    const frame = mapRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const x = clampPoint(((clientX - rect.left) / rect.width) * 100);
    const y = clampPoint(((clientY - rect.top) / rect.height) * 100);
    setPoints((current) => ({ ...current, [key]: { x, y } }));
  }

  function getPointFromPointer(clientX: number, clientY: number): CalibrationPoint | null {
    const frame = mapRef.current;
    if (!frame) return null;

    const rect = frame.getBoundingClientRect();
    return {
      x: clampPoint(((clientX - rect.left) / rect.width) * 100),
      y: clampPoint(((clientY - rect.top) / rect.height) * 100),
    };
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
          className="relative aspect-square min-h-80 overflow-hidden rounded-2xl bg-card/20 touch-none"
          onPointerMove={(event) => {
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
          }}
          onPointerCancel={() => {
            setDraggingKey(null);
            setDraggingGeoIndex(null);
          }}
          onClick={(event) => {
            if (mode !== "geo") return;
            addGeoControlPoint(event.clientX, event.clientY);
          }}
        >
          <Image
            src="/sites/moscow-cyber-map.webp"
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

          {mode === "sites" ? positionedPoints.map((positioned) => {
            const point = points[positioned.calibrationKey] ?? { x: positioned.x, y: positioned.y };
            const active = activeKey === positioned.calibrationKey;

            return (
              <button
                key={positioned.id}
                type="button"
                className={cn(
                  "absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center gap-2 rounded-full border bg-slate-950/90 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur active:cursor-grabbing",
                  active
                    ? "border-orange-300 text-orange-100"
                    : "border-white/15 text-cyan-100 hover:border-cyan-200/40",
                )}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setActiveKey(positioned.calibrationKey);
                  setDraggingKey(positioned.calibrationKey);
                  updatePointFromPointer(positioned.calibrationKey, event.clientX, event.clientY);
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <Grip className="size-3.5" aria-hidden />
                {formatPointLabel(positioned)}
              </button>
            );
          }) : null}
          {mode === "geo" ? geoControlPoints.map((point, index) => {
            const active = activeGeoIndex === index;

            return (
              <button
                key={`${point.latitude}:${point.longitude}:${index}`}
                type="button"
                className={cn(
                  "absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center gap-2 rounded-full border bg-slate-950/90 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur active:cursor-grabbing",
                  active
                    ? "border-cyan-200 text-cyan-100"
                    : "border-white/15 text-muted-foreground hover:border-cyan-200/40",
                )}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setActiveGeoIndex(index);
                  setDraggingGeoIndex(index);
                  updateGeoControlPointFromPointer(index, event.clientX, event.clientY);
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <Grip className="size-3.5" aria-hidden />
                Geo {index + 1}
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
                изображении. Три и более точки включат affine-привязку.
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
                      <span className="font-medium text-foreground">Geo {index + 1}</span>
                      <span className="text-xs">x: {point.x}, y: {point.y}</span>
                    </div>
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
