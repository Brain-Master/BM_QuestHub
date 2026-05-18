"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Navigation } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  MOSCOW_MAP_ATTRIBUTION,
  positionSitesOnMap,
  siteHasMapLocation,
  type PositionedSiteOnMap,
} from "@/lib/sites/map-projection";
import type { SiteScopeCard } from "@/lib/sites/scope-card";
import { cn } from "@/lib/utils";

type Props = {
  sites: SiteScopeCard[];
};

function primaryMetro(site: SiteScopeCard): string | undefined {
  return site.campuses.find((campus) => campus.metro && campus.metro !== "—")?.metro;
}

function PinPopover({ site }: { site: SiteScopeCard }) {
  const metro = primaryMetro(site);

  return (
    <PinPopoverFrame>
      <div className="relative">
        <p className="text-[10px] text-cyan-200/80 uppercase tracking-[0.2em]">
          Площадка BrainMaster
        </p>
        <p className="mt-1 font-heading font-semibold text-base text-white">{site.name}</p>
        <p className="mt-2 text-cyan-50/75 text-xs leading-relaxed">
          {metro ? `м. ${metro}` : site.locationSummary}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
          <span className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-2">
            <strong className="block font-heading text-lg text-white">{site.courseCount}</strong>
            курсов
          </span>
          <span className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-2">
            <strong className="block font-heading text-lg text-white">{site.shiftCount}</strong>
            групп
          </span>
        </div>
      </div>
    </PinPopoverFrame>
  );
}

function PinPopoverFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-64 -translate-x-1/2 translate-y-1 rounded-2xl border border-cyan-200/20 bg-slate-950/95 p-4 text-left opacity-0 shadow-[0_18px_70px_rgba(34,211,238,0.18)] ring-1 ring-white/10 backdrop-blur-xl transition duration-200 group-hover/pin:translate-y-0 group-hover/pin:opacity-100 group-focus-within/pin:translate-y-0 group-focus-within/pin:opacity-100">
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_42%),radial-gradient(circle_at_90%_20%,rgba(139,92,246,0.2),transparent_38%)]"
      />
      {children}
    </div>
  );
}

function MapPinMarker({ positioned }: { positioned: PositionedSiteOnMap }) {
  const { site, x, y } = positioned;
  const metro = primaryMetro(site);

  return (
    <div className="group/pin absolute z-10" style={{ left: `${x}%`, top: `${y}%` }}>
      <PinPopover site={site} />
      <Link
        href={`/sites/${site.slug}`}
        className="-translate-x-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full border border-cyan-100/40 bg-cyan-200/15 text-cyan-50 shadow-[0_0_0_6px_rgba(34,211,238,0.08),0_0_36px_rgba(34,211,238,0.45)] backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-cyan-200/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
        aria-label={`Открыть площадку ${site.name}${metro ? `, метро ${metro}` : ""}`}
      >
        <MapPin className="size-5" aria-hidden />
      </Link>
      {metro ? (
        <span className="pointer-events-none absolute left-1/2 top-8 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-cyan-50/80 backdrop-blur sm:block">
          {metro}
        </span>
      ) : null}
    </div>
  );
}

export function SitesMapSchematic({ sites }: Props) {
  const mappedSites = sites.filter(siteHasMapLocation);
  const positionedSites = positionSitesOnMap(mappedSites);

  if (mappedSites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-card/35 px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-foreground">
          Карта появится после добавления площадок
        </p>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground text-sm leading-relaxed">
          Добавьте адрес, метро или координаты, чтобы площадки появились на карте.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="relative min-h-[29rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0a0a] p-4 shadow-[0_24px_90px_rgba(2,6,23,0.48)] sm:p-6">
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-cyan-200/80 uppercase tracking-[0.22em]">
              Карта площадок
            </p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-white">
              География BrainMaster
            </h3>
          </div>
          <div className="hidden rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-cyan-100 text-xs sm:block">
            {mappedSites.length} точек
          </div>
        </div>

        <div className="relative mt-6 aspect-[0.82] min-h-80">
          <MapBackground />
          {positionedSites.map((positioned) => (
            <MapPinMarker key={positioned.site.slug} positioned={positioned} />
          ))}
        </div>

        <p className="relative mt-4 text-[10px] text-muted-foreground/80 leading-relaxed">
          <a
            href={MOSCOW_MAP_ATTRIBUTION.href}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 transition hover:text-muted-foreground hover:underline"
          >
            {MOSCOW_MAP_ATTRIBUTION.label}
          </a>
          . {MOSCOW_MAP_ATTRIBUTION.note}
        </p>
      </div>

      <aside className="rounded-[1.5rem] border border-white/10 bg-card/45 p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Navigation className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-heading font-semibold text-lg text-foreground">
              Выберите удобную зону
            </h3>
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
              Карта помогает быстро сравнить районы. Для точного маршрута откройте
              страницу площадки.
            </p>
          </div>
        </div>

        <SiteList mappedSites={mappedSites} />
      </aside>
    </div>
  );
}

function MapBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl bg-[#0a0a0a]"
      role="img"
      aria-label="Векторная карта Москвы с площадками BrainMaster"
    >
      <Image
        src="/sites/moscow-map.svg"
        alt=""
        fill
        className="object-contain object-center opacity-95"
      />
      <MapVignette />
    </div>
  );
}

function MapVignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(10,10,10,0.55)_100%)]"
    />
  );
}

function SiteList({ mappedSites }: { mappedSites: SiteScopeCard[] }) {
  return (
    <div className="mt-5 grid gap-3">
      {mappedSites.map((site) => {
        const metro = primaryMetro(site);

        return (
          <Link
            key={site.slug}
            href={`/sites/${site.slug}`}
            className="group rounded-2xl border border-white/10 bg-black/15 p-3 transition hover:border-cyan-200/25 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="font-medium text-foreground">{site.name}</p>
            <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
              {metro ? `м. ${metro}` : site.locationSummary}
            </p>
            <span
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "mt-2 h-auto p-0 text-primary text-xs",
              )}
            >
              Подробнее
              <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
