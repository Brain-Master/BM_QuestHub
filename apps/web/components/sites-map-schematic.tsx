"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Navigation } from "lucide-react";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
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

function PinPopover({ site, active }: { site: SiteScopeCard; active: boolean }) {
  const metro = primaryMetro(site);

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-6 left-1/2 z-20 w-max max-w-64 -translate-x-1/2 rounded-xl border border-orange-500/50 bg-slate-950/95 px-3 py-2 text-left shadow-[0_18px_70px_rgba(234,88,12,0.2)] backdrop-blur-xl transition duration-200",
        active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      <div className="relative">
        <p className="font-semibold text-sm text-white">{site.name}</p>
        <p className="mt-0.5 text-orange-300 text-xs leading-relaxed">
          {metro ? `м. ${metro}` : site.locationSummary}
        </p>
      </div>
    </div>
  );
}

function MapPinMarker({
  positioned,
  active,
  onActivate,
  onDeactivate,
}: {
  positioned: PositionedSiteOnMap;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const { site, x, y } = positioned;
  const metro = primaryMetro(site);

  return (
    <div
      className="absolute z-10"
      style={{ left: `${x}%`, top: `${y}%` }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
    >
      <PinPopover site={site} active={active} />
      <Link
        href={`/sites/${site.slug}/agenda`}
        className={cn(
          "-translate-x-1/2 -translate-y-1/2 relative flex size-5 items-center justify-center rounded-full border-2 border-black bg-orange-500 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          active
            ? "scale-125 shadow-[0_0_0_8px_rgba(234,88,12,0.18),0_0_34px_rgba(234,88,12,0.88)]"
            : "shadow-[0_0_0_6px_rgba(234,88,12,0.1),0_0_18px_rgba(234,88,12,0.55)] hover:scale-110",
        )}
        aria-label={`Открыть площадку ${site.name}${metro ? `, метро ${metro}` : ""}`}
        onFocus={onActivate}
        onBlur={onDeactivate}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-orange-500 opacity-70 motion-safe:animate-ping",
            active ? "scale-125" : "",
          )}
          aria-hidden
        />
        <span className="relative size-2 rounded-full bg-orange-100" aria-hidden />
      </Link>
    </div>
  );
}

export function SitesMapSchematic({ sites }: Props) {
  const [activeSiteSlug, setActiveSiteSlug] = useState<string | null>(null);
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

        <div className="relative mt-6 aspect-square min-h-80">
          <MapBackground />
          {positionedSites.map((positioned) => (
            <MapPinMarker
              key={positioned.site.slug}
              positioned={positioned}
              active={activeSiteSlug === positioned.site.slug}
              onActivate={() => setActiveSiteSlug(positioned.site.slug)}
              onDeactivate={() => setActiveSiteSlug(null)}
            />
          ))}
        </div>

        <p className="relative mt-4 text-[10px] text-muted-foreground/80 leading-relaxed">
          Статичная WebP-подложка, интерактивные точки отрисованы отдельным лёгким слоем.
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

        <SiteList
          mappedSites={mappedSites}
          activeSiteSlug={activeSiteSlug}
          onActivate={setActiveSiteSlug}
          onDeactivate={() => setActiveSiteSlug(null)}
        />
      </aside>
    </div>
  );
}

function MapBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl bg-black"
      role="img"
      aria-label="Кибер-карта Москвы с площадками BrainMaster"
    >
      <Image
        src="/sites/moscow-cyber-map.webp"
        alt=""
        fill
        className="object-cover object-center opacity-45 mix-blend-screen"
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
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(10,10,10,0.55)_100%)]"
    />
  );
}

function SiteList({
  mappedSites,
  activeSiteSlug,
  onActivate,
  onDeactivate,
}: {
  mappedSites: SiteScopeCard[];
  activeSiteSlug: string | null;
  onActivate: (slug: string) => void;
  onDeactivate: () => void;
}) {
  return (
    <div className="mt-5 grid gap-3">
      {mappedSites.map((site) => {
        const metro = primaryMetro(site);
        const active = activeSiteSlug === site.slug;

        return (
          <Link
            key={site.slug}
            href={`/sites/${site.slug}`}
            className={cn(
              "group rounded-2xl border bg-black/15 p-3 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-orange-400/60 shadow-[0_0_28px_rgba(234,88,12,0.18)]" : "border-white/10 hover:border-orange-300/30",
            )}
            onMouseEnter={() => onActivate(site.slug)}
            onMouseLeave={onDeactivate}
            onFocus={() => onActivate(site.slug)}
            onBlur={onDeactivate}
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
