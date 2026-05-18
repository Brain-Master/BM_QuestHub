"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
import { filterQuestsForSchool } from "@/lib/school-scope";
import type { Quest, Venue, World } from "@/lib/schemas";

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
  const router = useRouter();
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
  const scopedQuests = useMemo(
    () =>
      effectiveSchool
        ? filterQuestsForSchool(quests, venues, effectiveSchool)
        : quests,
    [effectiveSchool, quests, venues],
  );
  const programGroups = useMemo(
    () => buildProgramFilterGroups(scopedQuests, worlds),
    [scopedQuests, worlds],
  );
  const schoolScopes = useMemo(() => getSchoolScopes(venues), [venues]);
  const ages = useMemo(() => {
    const unique = Array.from(new Set(scopedQuests.map((q) => q.ageLabel))).sort(
      (a, b) => a.localeCompare(b, "ru", { numeric: true }),
    );
    return [ALL_VALUE, ...unique];
  }, [scopedQuests]);

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
    router.push(qs ? `${pathname}?${qs}` : pathname);
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
            {fixedSchool.name}
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
            <SelectItem value="intensive">Интенсив 5 дней</SelectItem>
            <SelectItem value="year">Годовой трек</SelectItem>
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
            <SelectItem value={DEFAULT_CATALOG_STATUS}>Активные</SelectItem>
            <SelectItem value={ALL_VALUE}>Все статусы</SelectItem>
            <SelectItem value="archived">Архивные</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-5 xl:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/10 bg-transparent hover:bg-white/5"
          onClick={() => router.push(pathname)}
        >
          Сбросить фильтры
        </Button>
      </div>
    </FilterDisclosure>
  );
}
