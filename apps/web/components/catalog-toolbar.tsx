"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { Activity, CalendarDays, MapPin, School, Shapes, Users } from "lucide-react";

import { FilterDisclosure } from "@/components/filter-disclosure";
import { ProgramFilterSelect } from "@/components/program-filter-select";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_PROGRAM_FILTER_VALUE,
  buildProgramFilterGroups,
  makeSeriesProgramFilterValue,
} from "@/lib/program-filter-options";
import { getSchoolScopes } from "@/lib/offers/agenda";
import { filterCatalog, type CatalogSearchParams } from "@/lib/catalog-filters";
import type { Quest, Venue, World } from "@/lib/schemas";
import { buildSiteHref } from "@/lib/sites/site-route";

type Props = {
  quests: Quest[];
  venues: Venue[];
  worlds: World[];
  fixedSchool?: {
    slug: string;
    name: string;
  };
};

const ALL_VALUE = "all";
const DEFAULT_CATALOG_STATUS = "active";

export function CatalogToolbar({ quests, venues, worlds, fixedSchool }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { format, program, age, status, school } = useMemo(() => {
    const legacyWorld = searchParams.get("world");
    return {
      format: searchParams.get("format") ?? ALL_VALUE,
      program: searchParams.get("program") ?? (legacyWorld ? makeSeriesProgramFilterValue(legacyWorld) : ALL_PROGRAM_FILTER_VALUE),
      age: searchParams.get("age") ?? ALL_VALUE,
      status: searchParams.get("status") ?? DEFAULT_CATALOG_STATUS,
      school: searchParams.get("school") ?? "",
    };
  }, [searchParams]);

  const effectiveSchool = fixedSchool?.slug ?? school;
  const current = {format, program, age, status, school:effectiveSchool};
  const facet = (patch:CatalogSearchParams) => filterCatalog(quests,venues,{...current,...patch});
  const programGroups = buildProgramFilterGroups(facet({program:ALL_PROGRAM_FILTER_VALUE}),worlds);
  const allSchools = getSchoolScopes(venues);
  const schoolScopes = allSchools.filter(scope=>facet({school:scope.slug}).length > 0);
  const formats = ["intensive","year"].filter(format=>facet({format}).length > 0);
  const statuses = ["active","archived"].filter(status=>facet({status}).length > 0);
  const ages = [ALL_VALUE, ...Array.from(new Set(facet({age:ALL_VALUE}).map(q=>q.ageLabel))).sort(
      (a, b) => a.localeCompare(b, "ru", { numeric: true }),
    )];

  const activeFiltersCount = [
    program !== ALL_PROGRAM_FILTER_VALUE,
    !fixedSchool && Boolean(school),
    format !== ALL_VALUE,
    age !== ALL_VALUE,
    status !== DEFAULT_CATALOG_STATUS,
  ].filter(Boolean).length;

  function pushNext(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (k === "program") params.delete("world");
      if (
        v === null ||
        v === "" ||
        (v === ALL_VALUE && k !== "status") ||
        (k === "status" && v === DEFAULT_CATALOG_STATUS)
      ) {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    const qs = params.toString();
    window.history.pushState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <FilterDisclosure
      title="Фильтры курсов"
      summary="Программа, площадка, формат, возраст, статус"
      panelId="catalog-filter-panel"
      activeCount={activeFiltersCount}
      contentClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      <label className="grid gap-2 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Shapes className="size-4 opacity-80" aria-hidden />
          Программа
        </span>
        <ProgramFilterSelect
          value={program}
          groups={programGroups}
          onValueChange={(v) => pushNext({ program: v })}
          triggerTestId="catalog-program-filter"
        />
      </label>

      {fixedSchool ? (
        <div className="grid min-w-0 gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <School className="size-4 opacity-80" aria-hidden />
            Площадка
          </span>
          <div className="flex h-10 items-center rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-foreground shadow-inner">
            <Link
              href={buildSiteHref(fixedSchool.slug)}
              className="truncate rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
            {fixedSchool.name}
            </Link>
          </div>
        </div>
      ) : (
        <label className="grid min-w-0 gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 opacity-80" aria-hidden />
            Площадка
          </span>
          <Select value={school || ALL_VALUE} onValueChange={(v) => pushNext({ school: v })}>
            <SelectTrigger
              data-testid="catalog-site-filter"
              className="w-full border-white/10 bg-black/20"
            >
              <SelectValue placeholder="Площадка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Все площадки</SelectItem>
              {school && school !== ALL_VALUE && !schoolScopes.some(s=>s.slug===school) && <SelectItem value={school} disabled>{allSchools.find(s=>s.slug===school)?.name ?? "Площадка из ссылки"} — нет групп</SelectItem>}
              {schoolScopes.map((scope) => (
                <SelectItem key={scope.slug} value={scope.slug}>
                  {scope.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      )}

      <label className="grid gap-2 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4 opacity-80" aria-hidden />
          Формат
        </span>
        <Select value={format} onValueChange={(v) => pushNext({ format: v })}>
          <SelectTrigger
            data-testid="catalog-format-filter"
            className="w-full border-white/10 bg-black/20"
          >
            <SelectValue placeholder="Формат" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все форматы</SelectItem>
            {formats.map(f=><SelectItem key={f} value={f}>{f==="year"?"Годовой трек":"Интенсив 5 дней"}</SelectItem>)}
            {format!==ALL_VALUE&&!formats.includes(format)&&<SelectItem value={format} disabled>Выбранный формат — нет групп</SelectItem>}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Users className="size-4 opacity-80" aria-hidden />
          Возраст
        </span>
        <Select value={age} onValueChange={(v) => pushNext({ age: v })}>
          <SelectTrigger
            data-testid="catalog-age-filter"
            className="w-full border-white/10 bg-black/20"
          >
            <SelectValue placeholder="Возраст" />
          </SelectTrigger>
          <SelectContent>
            {!ages.includes(age)&&<SelectItem value={age} disabled>{age} — нет групп</SelectItem>}
            {ages.map((value) => (
              <SelectItem key={value} value={value}>
                {value === ALL_VALUE ? "Все возрасты" : value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Activity className="size-4 opacity-80" aria-hidden />
          Статус
        </span>
        <Select value={status} onValueChange={(v) => pushNext({ status: v })}>
          <SelectTrigger
            data-testid="catalog-status-filter"
            className="w-full border-white/10 bg-black/20"
          >
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все статусы</SelectItem>
            {statuses.map(s=><SelectItem key={s} value={s}>{s==="active"?"Активные":"Архивные"}</SelectItem>)}
            {status!==ALL_VALUE&&!statuses.includes(status)&&<SelectItem value={status} disabled>{status==="active"?"Активные":"Архивные"} — нет групп</SelectItem>}
          </SelectContent>
        </Select>
      </label>

      <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-5 xl:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/10 bg-transparent hover:bg-white/5"
          onClick={() => window.history.pushState(null, "", pathname)}
        >
          Сбросить фильтры
        </Button>
      </div>
    </FilterDisclosure>
  );
}
