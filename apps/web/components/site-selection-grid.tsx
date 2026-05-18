"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Grid2X2, MapPin } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  SitesPageToolbar,
  type CityOption,
  type SitesSortValue,
  type SitesViewMode,
} from "@/components/sites-page-toolbar";
import { PREFERRED_SCHOOL_STORAGE_KEY } from "@/lib/preferred-school";
import type { SiteScopeCard } from "@/lib/sites/scope-card";
import { cn } from "@/lib/utils";

type Props = {
  sites: SiteScopeCard[];
  cityOptions: CityOption[];
};

const DEFAULT_SORT: SitesSortValue = "activity-desc";
const DEFAULT_VIEW: SitesViewMode = "grid";

const METRO_LINES_BY_STATION: Record<
  string,
  { number: string; name: string; color: string }
> = {
  Беляево: {
    number: "6",
    name: "Калужско-Рижская линия",
    color: "#F07E24",
  },
  "Верхние Лихоборы": {
    number: "10",
    name: "Люблинско-Дмитровская линия",
    color: "#BED12C",
  },
  Орехово: {
    number: "2",
    name: "Замоскворецкая линия",
    color: "#4FB04F",
  },
  Ясенево: {
    number: "6",
    name: "Калужско-Рижская линия",
    color: "#F07E24",
  },
  "Юго-Западная": {
    number: "1",
    name: "Сокольническая линия",
    color: "#E42313",
  },
  "Народное Ополчение": {
    number: "11",
    name: "Большая кольцевая линия",
    color: "#82C0C0",
  },
};

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
    "location-asc",
    "location-desc",
  ];
  return allowed.includes(value as SitesSortValue)
    ? (value as SitesSortValue)
    : DEFAULT_SORT;
}

function normalizeView(value: string | null): SitesViewMode {
  return value === "list" || value === "map" ? value : DEFAULT_VIEW;
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

function compareSites(a: SiteScopeCard, b: SiteScopeCard, sort: SitesSortValue) {
  if (sort === "name-asc") return a.name.localeCompare(b.name, "ru", { numeric: true });
  if (sort === "name-desc") return b.name.localeCompare(a.name, "ru", { numeric: true });
  if (sort === "activity-asc") return a.activityScore - b.activityScore;
  if (sort === "activity-desc") return b.activityScore - a.activityScore;
  if (sort === "location-asc") {
    return a.locationLabel.localeCompare(b.locationLabel, "ru", { numeric: true });
  }
  return b.locationLabel.localeCompare(a.locationLabel, "ru", { numeric: true });
}

function LogoMark({ site }: { site: SiteScopeCard }) {
  const showImage = site.logoUrl?.startsWith("/");

  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-white/40 sm:size-16 sm:p-2">
      {showImage && site.logoUrl ? (
        <Image
          src={site.logoUrl}
          alt=""
          width={56}
          height={56}
          className="size-full object-contain"
        />
      ) : (
        <span className="font-heading font-semibold text-base text-slate-950 sm:text-lg">
          {getInitials(site.name)}
        </span>
      )}
    </div>
  );
}

function SiteHeaderMeta({
  site,
  showCityInHeader,
}: {
  site: SiteScopeCard;
  showCityInHeader: boolean;
}) {
  if (!showCityInHeader && !site.district) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-cyan-100/85 text-xs tracking-[0.16em]">
      {showCityInHeader ? <span className="uppercase">{site.cityLabel}</span> : null}
      {showCityInHeader && site.district ? (
        <span aria-hidden className="text-cyan-100/50">
          ·
        </span>
      ) : null}
      {site.district ? <span className="normal-case">{site.district}</span> : null}
    </p>
  );
}

function MetroLabel({ metro, className }: { metro?: string; className?: string }) {
  if (!metro || metro === "—") return null;

  const line = METRO_LINES_BY_STATION[metro];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {line ? (
        <span
          aria-label={line.name}
          title={line.name}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full font-semibold text-[10px] text-white leading-none"
          style={{ backgroundColor: line.color }}
        >
          {line.number}
        </span>
      ) : null}
      <span>{metro}</span>
    </span>
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
              <p className="font-medium text-foreground">{campus.name}</p>
              <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{campus.address}</p>
              {showTransit ? (
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground text-xs leading-relaxed">
                  <MetroLabel metro={campus.metro} />
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

function SiteActions({ site }: { site: SiteScopeCard }) {
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

function SiteCard({
  site,
  view,
  showCityInHeader,
}: {
  site: SiteScopeCard;
  view: SitesViewMode;
  showCityInHeader: boolean;
}) {
  return (
    <article
      className={cn(
        "group flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/55 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl",
        view === "list" && "md:grid md:grid-cols-[minmax(0,1fr)_18rem] md:items-stretch",
      )}
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
              {site.name}
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

function SitesMapPlaceholder({ sites }: { sites: SiteScopeCard[] }) {
  const mapped = sites.filter((site) => site.hasMapCoordinates);

  if (mapped.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-card/35 px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-foreground">
          Карта появится после добавления координат
        </p>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground text-sm leading-relaxed">
          Для режима карты нужно заполнить latitude и longitude у корпусов
          площадок. Пока используйте сетку или список.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card/35 p-5">
      <p className="font-heading text-xl font-semibold text-foreground">
        Площадки на карте
      </p>
      <div className="mt-4 grid gap-3">
        {mapped.map((site) => (
          <div key={site.slug} className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="font-medium text-foreground">{site.name}</p>
            <p className="mt-1 text-muted-foreground text-sm">{site.locationSummary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SiteSelectionGrid({ sites, cityOptions }: Props) {
  const searchParams = useSearchParams();
  const city = searchParams.get("city") ?? cityOptions[0]?.value ?? "moscow";
  const sort = normalizeSort(searchParams.get("sort"));
  const view = normalizeView(searchParams.get("view"));

  const visibleSites = useMemo(
    () =>
      sites
        .filter((site) => site.city === city)
        .sort((a, b) => compareSites(a, b, sort)),
    [city, sites, sort],
  );
  const mapEnabled = sites.some((site) => site.hasMapCoordinates);
  const showCityInHeader = cityOptions.length > 1;

  return (
    <section className="space-y-8">
      <div className="grid gap-4 border-b border-white/10 pb-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Сначала выберите площадку
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            Так мы покажем ближайшие запуски и курсы без лишних площадок. Полный
            список BrainMaster остаётся доступен, если хотите сравнить все варианты.
          </p>
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

      <SitesPageToolbar
        cityOptions={cityOptions}
        city={city}
        sort={sort}
        view={view}
        mapEnabled={mapEnabled}
      />

      {view === "map" ? (
        <SitesMapPlaceholder sites={visibleSites} />
      ) : (
        <div
          className={cn(
            "grid gap-6",
            view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1",
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
      )}
    </section>
  );
}
