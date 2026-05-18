"use client";

import Image from "next/image";
import { Download, Grip, MapPin, Copy } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { positionSitesOnMap } from "@/lib/sites/map-projection";
import type { SiteScopeCard } from "@/lib/sites/scope-card";
import { cn } from "@/lib/utils";

type Props = {
  sites: SiteScopeCard[];
};

type CalibrationPoint = {
  x: number;
  y: number;
};

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

export function SiteMapCalibrator({ sites }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const positionedSites = useMemo(() => positionSitesOnMap(sites), [sites]);
  const initialPoints = useMemo(
    () =>
      Object.fromEntries(
        positionedSites.map((positioned) => [
          positioned.site.slug,
          { x: positioned.x, y: positioned.y },
        ]),
      ) as Record<string, CalibrationPoint>,
    [positionedSites],
  );
  const [points, setPoints] = useState(initialPoints);
  const [activeSlug, setActiveSlug] = useState(positionedSites[0]?.site.slug ?? null);
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const exportText = formatCalibration(points);

  function updatePointFromPointer(slug: string, clientX: number, clientY: number) {
    const frame = mapRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const x = clampPoint(((clientX - rect.left) / rect.width) * 100);
    const y = clampPoint(((clientY - rect.top) / rect.height) * 100);
    setPoints((current) => ({ ...current, [slug]: { x, y } }));
  }

  async function copyCalibration() {
    await navigator.clipboard.writeText(exportText);
  }

  function downloadCalibration() {
    const blob = new Blob([exportText], { type: "text/typescript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "map-calibration.ts";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="rounded-[1.75rem] border border-white/10 bg-[#0a0a0a] p-4 shadow-[0_24px_90px_rgba(2,6,23,0.48)] sm:p-6">
        <div
          ref={mapRef}
          className="relative aspect-square min-h-80 overflow-hidden rounded-2xl bg-black touch-none"
          onPointerMove={(event) => {
            if (!draggingSlug) return;
            updatePointFromPointer(draggingSlug, event.clientX, event.clientY);
          }}
          onPointerUp={() => setDraggingSlug(null)}
          onPointerCancel={() => setDraggingSlug(null)}
        >
          <Image
            src="/sites/moscow-cyber-map.webp"
            alt=""
            fill
            className="object-cover object-center opacity-45 mix-blend-screen"
            sizes="(min-width: 1024px) 800px, calc(100vw - 2rem)"
            priority
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(10,10,10,0.55)_100%)]"
          />

          {positionedSites.map((positioned) => {
            const site = positioned.site;
            const point = points[site.slug] ?? { x: positioned.x, y: positioned.y };
            const active = activeSlug === site.slug;

            return (
              <button
                key={site.slug}
                type="button"
                className={cn(
                  "absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center gap-2 rounded-full border bg-slate-950/90 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur active:cursor-grabbing",
                  active
                    ? "border-orange-300 text-orange-100"
                    : "border-white/15 text-cyan-100 hover:border-cyan-200/40",
                )}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setActiveSlug(site.slug);
                  setDraggingSlug(site.slug);
                  updatePointFromPointer(site.slug, event.clientX, event.clientY);
                }}
              >
                <Grip className="size-3.5" aria-hidden />
                {site.name}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-card/45 p-4 backdrop-blur-md">
        <div>
          <h2 className="font-heading text-xl font-semibold">Точки</h2>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
            Значения сохраняются только в браузере. Для фиксации скопируйте объект в файл
            калибровки.
          </p>
        </div>

        <div className="max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/15 p-2">
          {positionedSites.map((positioned) => {
            const site = positioned.site;
            const point = points[site.slug] ?? { x: positioned.x, y: positioned.y };
            const active = activeSlug === site.slug;

            return (
              <button
                key={site.slug}
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                  active ? "bg-orange-500/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.06]",
                )}
                onClick={() => setActiveSlug(site.slug)}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{site.name}</span>
                  <span className="block text-xs">
                    x: {point.x}, y: {point.y}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

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
        </div>
      </aside>
    </div>
  );
}
