"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Grid2X2, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { CitySelectionGrid } from "@/components/city-selection-grid";
import { MetroLabel } from "@/components/metro-label";
import { buttonVariants } from "@/components/ui/button";
import {
  SitesPageToolbar,
  type CityOption,
  type SitesMapColorMode,
  type SitesTypeFilterValue,
  type SitesSortValue,
  type SitesViewMode,
  type SiteTypeOption,
} from "@/components/sites-page-toolbar";
import { SitesMapSchematic } from "@/components/sites-map-schematic";
import { positionSitesOnMap, siteHasMapLocation } from "@/lib/sites/map-projection";
import { PREFERRED_SCHOOL_STORAGE_KEY } from "@/lib/preferred-school";
import type { CityCard } from "@/lib/sites/city-card";
import { toCityOptions } from "@/lib/sites/city-card";
import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import type { SiteScopeCard } from "@/lib/sites/scope-card";
import { buildSiteHref } from "@/lib/sites/site-route";
import { cn } from "@/lib/utils";

type Props = {
  sites: SiteScopeCard[];
  cityCards: CityCard[];
};

const DEFAULT_SORT: SitesSortValue = "activity-desc";
const DEFAULT_VIEW: SitesViewMode = "grid";
const TYPE_LABELS: Record<SiteScopeCard["type"], string> = {
  school: "Школы-партнёры",
  bm_base: "Базы BrainMaster",
};

const MAP_SNAP_SCROLL_DEBOUNCE_MS = 140;
const MAP_SNAP_TOP_TOLERANCE_PX = 8;
const MAP_SNAP_TRIGGER_MAX_PX = 180;
const MAP_SNAP_TRIGGER_MAX_VIEWPORT_RATIO = 0.28;

function rememberSite(site: SiteScopeCard) {
  localStorage.setItem(
    PREFERRED_SCHOOL_STORAGE_KEY,
    JSON.stringify({ slug: site.slug, name: site.name }),
  );
}

function normalizeSort(value: string | null): SitesSortValue {
  const allowed: SitesSortValue[] = [
    "name-asc",
    "name-desc",
    "activity-desc",
    "activity-asc",
    "address-asc",
    "address-desc",
    "metro-asc",
    "metro-desc",
  ];
  return allowed.includes(value as SitesSortValue)
    ? (value as SitesSortValue)
    : DEFAULT_SORT;
}

function normalizeView(value: string | null): SitesViewMode {
  return value === "list" || value === "map" ? value : DEFAULT_VIEW;
}

function normalizeMapColorMode(value: string | null): SitesMapColorMode {
  return value === "site" ? "site" : "default";
}

function normalizeSearch(value: string | null): string {
  return value?.trim().toLocaleLowerCase("ru") ?? "";
}

function getInitials(name: string): string {
  const number = name.match(/\d+/)?.[0];
  if (number) return `№${number}`;

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getPrimaryAddress(site: SiteScopeCard): string {
  return site.campuses[0]?.address ?? site.locationLabel;
}

function getPrimaryMetro(site: SiteScopeCard): string {
  return (
    site.campuses.find((campus) => campus.metro && campus.metro !== "—")?.metro ??
    "Метро уточняется"
  );
}

function compareSites(a: SiteScopeCard, b: SiteScopeCard, sort: SitesSortValue) {
  if (sort === "name-asc") return a.name.localeCompare(b.name, "ru", { numeric: true });
  if (sort === "name-desc") return b.name.localeCompare(a.name, "ru", { numeric: true });
  if (sort === "activity-asc") return a.activityScore - b.activityScore;
  if (sort === "activity-desc") return b.activityScore - a.activityScore;
  if (sort === "address-asc") {
    return getPrimaryAddress(a).localeCompare(getPrimaryAddress(b), "ru", { numeric: true });
  }
  if (sort === "address-desc") {
    return getPrimaryAddress(b).localeCompare(getPrimaryAddress(a), "ru", { numeric: true });
  }
  if (sort === "metro-asc") {
    return getPrimaryMetro(a).localeCompare(getPrimaryMetro(b), "ru", { numeric: true });
  }
  return getPrimaryMetro(b).localeCompare(getPrimaryMetro(a), "ru", { numeric: true });
}

function siteMatchesQuery(site: SiteScopeCard, query: string): boolean {
  if (!query) return true;

  const searchable = [
    site.name,
    site.locationLabel,
    site.locationSummary,
    site.cityLabel,
    site.district,
    ...site.campuses.flatMap((campus) => [
      campus.name,
      campus.address,
      campus.metro,
      campus.district,
      campus.entranceNote,
      campus.contactNote,
      ...campus.directions,
    ]),
  ];

  return searchable.some((value) => value?.toLocaleLowerCase("ru").includes(query));
}

function LogoMark({ site, compact = false }: { site: SiteScopeCard; compact?: boolean }) {
  const logoSrc = resolvePublicMediaUrl(site.logoUrl);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-white/40",
        compact
          ? "size-14 rounded-2xl p-1.5 shadow-md sm:size-16"
          : "size-12 rounded-2xl p-1.5 shadow-lg sm:size-16 sm:p-2",
      )}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt=""
          width={56}
          height={56}
          className="size-full object-contain"
        />
      ) : (
        <span
          className={cn(
            "font-heading font-semibold text-slate-950",
            compact ? "text-lg sm:text-xl" : "text-base sm:text-lg",
          )}
        >
          {getInitials(site.name)}
        </span>
      )}
    </div>
  );
}

function resolveSiteHeaderDistrict(site: SiteScopeCard): string | undefined {
  if (site.campusCount > 1) return site.locationLabel;
  return site.district;
}

function SiteHeaderMeta({
  site,
  showCityInHeader,
}: {
  site: SiteScopeCard;
  showCityInHeader: boolean;
}) {
  const districtLabel = resolveSiteHeaderDistrict(site);
  if (!showCityInHeader && !districtLabel) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-cyan-100/85 text-xs tracking-[0.16em]">
      {showCityInHeader ? <span className="uppercase">{site.cityLabel}</span> : null}
      {showCityInHeader && districtLabel ? (
        <span aria-hidden className="text-cyan-100/50">
          ·
        </span>
      ) : null}
      {districtLabel ? <span className="normal-case">{districtLabel}</span> : null}
    </p>
  );
}

function SiteListHeaderMeta({
  site,
  showCityInHeader,
}: {
  site: SiteScopeCard;
  showCityInHeader: boolean;
}) {
  const districtLabel = resolveSiteHeaderDistrict(site);
  if (!showCityInHeader && !districtLabel) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground text-xs">
      {showCityInHeader ? (
        <span className="font-medium uppercase tracking-[0.12em]">{site.cityLabel}</span>
      ) : null}
      {showCityInHeader && districtLabel ? <span aria-hidden>·</span> : null}
      {districtLabel ? <span>{districtLabel}</span> : null}
    </p>
  );
}

function LocationBlock({ site }: { site: SiteScopeCard }) {
  if (site.campusCount === 1) {
    const campus = site.campuses[0];
    if (!campus) return null;

    return (
      <div className="flex gap-2 rounded-xl border border-white/10 bg-black/15 p-2.5 text-sm sm:p-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <p className="font-medium text-foreground leading-relaxed">{campus.address}</p>
          {campus.metro && campus.metro !== "—" ? (
            <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
              <MetroLabel metro={campus.metro} />
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const distinctDistricts = new Set(
    site.campuses.map((campus) => campus.district).filter(Boolean),
  );
  const showDistrictPerCampus = distinctDistricts.size > 1;

  return (
    <details className="group rounded-xl border border-white/10 bg-black/15 p-2.5 text-sm sm:p-3">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-muted-foreground marker:hidden">
        <span className="flex min-w-0 gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span className="block min-w-0 font-medium text-foreground">{site.locationSummary}</span>
        </span>
        <span className="shrink-0 text-xs transition group-open:rotate-180" aria-hidden>
          ↓
        </span>
      </summary>
      <div className="mt-3 space-y-2 border-white/10 border-t pt-3">
        {site.campuses.map((campus) => {
          const showTransit = Boolean(
            (campus.metro && campus.metro !== "—") ||
              (showDistrictPerCampus && campus.district),
          );

          return (
            <div key={campus.slug} className="rounded-lg bg-white/[0.04] p-2.5 sm:p-3">
              <p className="font-medium text-foreground">{campus.headline}</p>
              {campus.headline !== campus.address ? (
                <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{campus.address}</p>
              ) : null}
              {showTransit ? (
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground text-xs leading-relaxed">
                  {campus.metro && campus.metro !== "—" ? (
                    <MetroLabel metro={campus.metro} />
                  ) : null}
                  {campus.metro &&
                  campus.metro !== "—" &&
                  showDistrictPerCampus &&
                  campus.district ? (
                    <span aria-hidden>·</span>
                  ) : null}
                  {showDistrictPerCampus && campus.district ? (
                    <span>{campus.district}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
  );
}

function SiteListLocation({ site }: { site: SiteScopeCard }) {
  if (site.campusCount === 1) {
    const campus = site.campuses[0];
    if (!campus) return null;

    return (
      <div className="flex min-w-0 gap-1.5 text-sm">
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 text-muted-foreground leading-snug">
          <span className="font-medium text-foreground">{campus.address}</span>
          {campus.metro && campus.metro !== "—" ? (
            <>
              <span aria-hidden> · </span>
              <MetroLabel metro={campus.metro} />
            </>
          ) : null}
        </p>
      </div>
    );
  }

  const distinctDistricts = new Set(
    site.campuses.map((campus) => campus.district).filter(Boolean),
  );
  const showDistrictPerCampus = distinctDistricts.size > 1;

  return (
    <details className="group rounded-xl border border-white/10 bg-black/10 px-2.5 py-1.5 text-sm">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 marker:hidden">
        <span className="flex min-w-0 gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 font-medium text-foreground leading-snug">
            {site.locationSummary}
          </span>
        </span>
        <span className="shrink-0 text-muted-foreground text-xs transition group-open:rotate-180" aria-hidden>
          ↓
        </span>
      </summary>
      <div className="mt-1.5 grid gap-1.5 border-white/10 border-t pt-1.5">
        {site.campuses.map((campus) => {
          const showTransit = Boolean(
            (campus.metro && campus.metro !== "—") ||
              (showDistrictPerCampus && campus.district),
          );

          return (
            <div key={campus.slug} className="rounded-lg bg-white/[0.04] px-2.5 py-2">
              <p className="font-medium text-foreground text-sm leading-snug">{campus.headline}</p>
              {campus.headline !== campus.address ? (
                <p className="mt-0.5 text-muted-foreground text-xs leading-snug">{campus.address}</p>
              ) : null}
              {showTransit ? (
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground text-xs leading-snug">
                  {campus.metro && campus.metro !== "—" ? (
                    <MetroLabel metro={campus.metro} />
                  ) : null}
                  {campus.metro &&
                  campus.metro !== "—" &&
                  showDistrictPerCampus &&
                  campus.district ? (
                    <span aria-hidden>·</span>
                  ) : null}
                  {showDistrictPerCampus && campus.district ? (
                    <span>{campus.district}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
  );
}

function SiteStats({ site }: { site: SiteScopeCard }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div className="flex min-h-14 flex-col items-center justify-center rounded-xl border border-white/10 bg-black/15 p-2.5 text-center sm:min-h-20 sm:p-3">
        <p className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
          {site.courseCount}
        </p>
        <p className="mt-0.5 text-muted-foreground text-xs sm:mt-1">курсов</p>
        <p className="text-muted-foreground/80 text-[11px]">проводится</p>
      </div>
      <div className="flex min-h-14 flex-col items-center justify-center rounded-xl border border-white/10 bg-black/15 p-2.5 text-center sm:min-h-20 sm:p-3">
        <p className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
          {site.shiftCount}
        </p>
        <p className="mt-0.5 text-muted-foreground text-xs sm:mt-1">групп</p>
        <p className="text-muted-foreground/80 text-[11px]">открыто</p>
      </div>
    </div>
  );
}

function SiteListStats({ site }: { site: SiteScopeCard }) {
  const stats = [
    { value: site.courseCount, label: "курсов", hint: "проводится" },
    { value: site.shiftCount, label: "групп", hint: "открыто" },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {stats.map((stat) => (
        <div
          key={stat.hint}
          className="inline-flex items-baseline gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-xs"
        >
          <span className="font-heading font-semibold text-foreground tabular-nums text-base leading-none">
            {stat.value}
          </span>
          <span className="text-muted-foreground">{stat.label}</span>
          <span className="text-muted-foreground/70">{stat.hint}</span>
        </div>
      ))}
    </div>
  );
}

function SiteActions({ site }: { site: SiteScopeCard }) {
  if (site.shiftCount === 0) return <InactiveSiteActions site={site} />;
  return (
    <div className="mt-auto grid gap-2">
      <Link
        href={`/sites/${site.slug}/agenda`}
        className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2 sm:h-10 sm:px-4 sm:text-sm")}
        onClick={() => rememberSite(site)}
      >
        <CalendarDays className="size-4" aria-hidden />
        Расписание
      </Link>
      <Link
        href={`/sites/${site.slug}/catalog`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2 border-white/10 bg-transparent hover:bg-white/5 sm:h-10 sm:px-4 sm:text-sm",
        )}
        onClick={() => rememberSite(site)}
      >
        <Grid2X2 className="size-4" aria-hidden />
        Доступные курсы
      </Link>
    </div>
  );
}

function SiteListActions({ site }: { site: SiteScopeCard }) {
  if (site.shiftCount === 0) return <InactiveSiteActions site={site} />;
  return (
    <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
      <Link
        href={`/sites/${site.slug}/agenda`}
        className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
        onClick={() => rememberSite(site)}
      >
        <CalendarDays className="size-4" aria-hidden />
        Расписание
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
    </div>
  );
}

function InactiveSiteActions({site}: {site: SiteScopeCard}) {
  return <div className="mt-auto grid gap-2">
    <p className="text-sm text-muted-foreground">{site.slug === "bm-base-moscow" ? "Готовится к открытию · занятий пока нет" : "Сейчас нет групп"}</p>
    <Link href={buildSiteHref(site.slug)} className={buttonVariants({variant:"outline",size:"sm"})}>О площадке</Link>
  </div>;
}

function SiteListCard({
  site,
  showCityInHeader,
}: {
  site: SiteScopeCard;
  showCityInHeader: boolean;
}) {
  return (
    <article data-site={site.slug} data-inactive={site.shiftCount === 0 || undefined} className={cn("group overflow-hidden rounded-2xl border border-white/10 bg-card/55 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl",site.shiftCount === 0 && "grayscale")}>
      <div className="grid gap-2.5 p-2.5 md:grid-cols-[minmax(0,1fr)_12.5rem] md:items-center md:p-3">
        <div className="flex min-w-0 gap-2.5">
          <div className="relative flex w-20 shrink-0 self-stretch overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700/80 via-indigo-700/65 to-cyan-700/60 p-1.5 sm:w-24">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.22),transparent_42%)]"
            />
            <div className="relative flex w-full items-center justify-center">
              <LogoMark site={site} compact />
            </div>
          </div>

          <div className="grid min-w-0 flex-1 gap-1.5 py-0.5">
            <div className="min-w-0">
              <SiteListHeaderMeta site={site} showCityInHeader={showCityInHeader} />
              <h3 className="font-heading text-lg font-semibold text-foreground leading-tight">
                <Link
                  href={buildSiteHref(site.slug)}
                  className="rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => rememberSite(site)}
                >
                  {site.name}
                </Link>
              </h3>
            </div>
            <SiteListLocation site={site} />
            <SiteListStats site={site} />
          </div>
        </div>

        <SiteListActions site={site} />
      </div>
    </article>
  );
}

function SiteCard({
  site,
  view,
  showCityInHeader,
}: {
  site: SiteScopeCard;
  view: SitesViewMode;
  showCityInHeader: boolean;
}) {
  if (view === "list") {
    return <SiteListCard site={site} showCityInHeader={showCityInHeader} />;
  }

  return (
    <article
      data-site={site.slug} data-inactive={site.shiftCount === 0 || undefined}
      className={cn("group flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/55 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl",site.shiftCount === 0 && "grayscale")}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700/80 via-indigo-700/65 to-cyan-700/60 p-3.5 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.22),transparent_42%)]"
        />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <LogoMark site={site} />
          <div className="min-w-0">
            <SiteHeaderMeta site={site} showCityInHeader={showCityInHeader} />
            <h3 className="mt-1 font-heading text-lg font-semibold text-white leading-tight sm:text-xl">
              <Link
                href={buildSiteHref(site.slug)}
                className="rounded-sm transition hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => rememberSite(site)}
              >
                {site.name}
              </Link>
            </h3>
          </div>
        </div>
        <div className="hidden" aria-hidden>
          <span>Лучшая цена</span>
          <span>Крупнейшая площадка</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3.5 sm:gap-5 sm:p-5">
        <LocationBlock site={site} />
        <SiteStats site={site} />
        <SiteActions site={site} />
      </div>
    </article>
  );
}

function SitesEmptyState() {
  return (
    <section className="rounded-2xl border border-white/10 bg-card/45 p-8 text-center">
      <h2 className="font-heading text-xl font-semibold text-foreground">
        Пока нет активных площадок
      </h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm leading-relaxed">
        Когда появятся курсы и открытые группы в вашем городе, мы покажем их здесь.
        А пока можно посмотреть полный каталог BrainMaster.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/catalog" className={buttonVariants({ variant: "default", size: "sm" })}>
          Все курсы
        </Link>
        <Link
          href="/agenda"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-white/10 bg-transparent hover:bg-white/5",
          )}
        >
          Все расписание
        </Link>
      </div>
    </section>
  );
}

function SitesListSection({
  sites,
  cityCards,
  city,
  cityOptions,
}: {
  sites: SiteScopeCard[];
  cityCards: CityCard[];
  city: string;
  cityOptions: CityOption[];
}) {
  const searchParams = useSearchParams();
  const mapSnapRef = useRef<HTMLDivElement>(null);
  const sort = normalizeSort(searchParams.get("sort"));
  const view = normalizeView(searchParams.get("view"));
  const mapColorMode = normalizeMapColorMode(searchParams.get("mapColors"));
  const query = searchParams.get("q")?.trim() ?? "";
  const normalizedQuery = normalizeSearch(query);
  const selectedCityLabel = cityCards.find((item) => item.slug === city)?.label;
  const showAllCitiesLink = cityCards.length > 1;

  const citySites = useMemo(
    () => sites.filter((site) => site.city === city),
    [city, sites],
  );
  const citySitesWithOpenGroups = useMemo(() => citySites.filter(site => site.shiftCount > 0), [citySites]);
  const typeOptions = useMemo<SiteTypeOption[]>(() => {
    const values = Array.from(
      new Set(citySitesWithOpenGroups.filter(site=>siteMatchesQuery(site,normalizedQuery)).map((site) => site.type)),
    ).sort((a, b) => TYPE_LABELS[a].localeCompare(TYPE_LABELS[b], "ru"));

    return values.map((value) => ({
      value,
      label: TYPE_LABELS[value],
    }));
  }, [citySitesWithOpenGroups, normalizedQuery]);
  const toolbarTypeOptions = typeOptions;
  const type = (searchParams.get("type") || "all") as SitesTypeFilterValue;
  const visibleSites = useMemo(
    () =>
      citySites
        .filter((site) => type === "all" || site.type === type)
        .filter((site) => siteMatchesQuery(site, normalizedQuery))
        .sort((a, b) => compareSites(a, b, sort)),
    [citySites, normalizedQuery, sort, type],
  );
  const mapSites = useMemo(
    () => visibleSites.filter(siteHasMapLocation),
    [visibleSites],
  );
  const mapPointCount = useMemo(() => positionSitesOnMap(mapSites).length, [mapSites]);
  const mapEnabled = mapSites.length > 0;
  const showCityInHeader = cityCards.length > 1;
  const toolbar = (
    <SitesPageToolbar
      cityOptions={cityOptions.filter(option=>sites.some(site=>site.city===option.value&&site.shiftCount>0&&(type==="all"||site.type===type)&&siteMatchesQuery(site,normalizedQuery)))}
      city={city}
      query={query}
      sort={sort}
      view={view}
      mapEnabled={mapEnabled}
      type={type}
      typeOptions={toolbarTypeOptions}
      totalCount={citySites.length}
      visibleCount={visibleSites.length}
      mapPointCount={mapPointCount}
      mapColorMode={mapColorMode}
      variant={view === "map" ? "mapPanel" : "default"}
    />
  );

  useEffect(() => {
    if (view !== "map") return;

    const section = mapSnapRef.current;
    if (!section) return;
    const snapSection = section;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastScrollY = window.scrollY;
    let isEligibleForSnap = false;
    let snapTimer: number | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isEligibleForSnap = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.2);
      },
      { threshold: [0, 0.2, 0.5, 1] },
    );

    function clearSnapTimer() {
      if (!snapTimer) return;
      window.clearTimeout(snapTimer);
      snapTimer = null;
    }

    function scheduleSnap() {
      const currentScrollY = window.scrollY;
      const isScrollingTowardMap = currentScrollY > lastScrollY;
      lastScrollY = currentScrollY;

      if (!isScrollingTowardMap || !isEligibleForSnap) return;
      clearSnapTimer();
      snapTimer = window.setTimeout(() => {
        const { top } = snapSection.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const triggerMax = Math.min(
          MAP_SNAP_TRIGGER_MAX_PX,
          viewportHeight * MAP_SNAP_TRIGGER_MAX_VIEWPORT_RATIO,
        );
        const isCloseToSettledPosition = top > MAP_SNAP_TOP_TOLERANCE_PX && top <= triggerMax;
        if (!isCloseToSettledPosition) return;

        snapSection.scrollIntoView({
          block: "start",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }, MAP_SNAP_SCROLL_DEBOUNCE_MS);
    }

    observer.observe(snapSection);
    window.addEventListener("scroll", scheduleSnap, { passive: true });

    return () => {
      clearSnapTimer();
      observer.disconnect();
      window.removeEventListener("scroll", scheduleSnap);
    };
  }, [view]);

  return (
    <section className="space-y-8">
      <div className="grid gap-4 border-b border-white/10 pb-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          {showAllCitiesLink ? (
            <Link
              href="/sites"
              className="mb-3 inline-flex text-muted-foreground text-xs transition hover:text-foreground"
            >
              ← Все города
            </Link>
          ) : null}
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {selectedCityLabel
              ? `Площадки · ${selectedCityLabel}`
              : "Сначала выберите площадку"}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            У каждой площадки своё расписание и доступные смены. Выберите удобную
            локацию — всё остальное откроется внутри.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["Адреса и метро", "Карта площадок", "Расписание по корпусам"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-cyan-50/80"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <p className="mb-2 text-muted-foreground text-xs">
            Не знаете площадку или хотите сравнить всё?
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/catalog" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Все курсы
            </Link>
            <Link
              href="/agenda"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 bg-transparent hover:bg-white/5",
              )}
            >
              Все расписание
            </Link>
          </div>
        </div>
      </div>

      {visibleSites.length === 0 && view !== "map" ? (
        <div className="grid gap-4">
          {toolbar}
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-muted-foreground text-sm">
            Сейчас нет площадок с открытыми группами по выбранным фильтрам.
          </p>
        </div>
      ) : view === "map" ? (
        <div ref={mapSnapRef} id="sites-map-section" data-sites-map-snap>
          <SitesMapSchematic
            sites={mapSites}
            visibleSites={visibleSites}
            filterSlot={toolbar}
            mapColorMode={mapColorMode}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {toolbar}
          <div
            className={cn(
              "grid",
              view === "grid" ? "gap-6 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 gap-3",
            )}
          >
            {visibleSites.map((site) => (
              <SiteCard
                key={site.slug}
                site={site}
                view={view}
                showCityInHeader={showCityInHeader}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function SiteSelectionGrid({ sites, cityCards }: Props) {
  const searchParams = useSearchParams();
  const requestedCity = searchParams.get("city")?.trim() || null;
  const hasCityShowcase = cityCards.length > 1;

  if (cityCards.length === 0) {
    return <SitesEmptyState />;
  }

  if (hasCityShowcase && !requestedCity) {
    return <CitySelectionGrid cities={cityCards} />;
  }

  const effectiveCity = requestedCity ?? cityCards[0]!.slug;
  const cityOptions = toCityOptions(cityCards);

  return (
    <SitesListSection
      sites={sites}
      cityCards={cityCards}
      city={effectiveCity}
      cityOptions={cityOptions}
    />
  );
}
