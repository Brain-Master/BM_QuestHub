"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Grid2X2,
  List,
  MapPinned,
  Palette,
  RotateCcw,
  Search,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type SitesSortValue =
  | "name-asc"
  | "name-desc"
  | "activity-desc"
  | "activity-asc"
  | "address-asc"
  | "address-desc"
  | "metro-asc"
  | "metro-desc";

export type SitesViewMode = "grid" | "list" | "map";
export type SitesTypeFilterValue = "all" | "school" | "bm_base";
export type SitesMapColorMode = "default" | "site";

export type CityOption = {
  value: string;
  label: string;
};

export type SiteTypeOption = {
  value: Exclude<SitesTypeFilterValue, "all">;
  label: string;
};

type Props = {
  cityOptions: CityOption[];
  city: string;
  query: string;
  sort: SitesSortValue;
  view: SitesViewMode;
  mapEnabled: boolean;
  type: SitesTypeFilterValue;
  typeOptions: SiteTypeOption[];
  totalCount: number;
  visibleCount: number;
  mapPointCount: number;
  mapColorMode: SitesMapColorMode;
  variant?: "default" | "mapPanel";
};

const VIEW_OPTIONS: Array<{
  value: SitesViewMode;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "grid", label: "Сетка", icon: Grid2X2 },
  { value: "list", label: "Список", icon: List },
  { value: "map", label: "Карта", icon: MapPinned },
];

const SORT_OPTIONS: Array<{
  key: "name" | "activity" | "address" | "metro";
  label: string;
}> = [
  { key: "name", label: "По названию" },
  { key: "activity", label: "По активности" },
  { key: "address", label: "По адресу" },
  { key: "metro", label: "По метро" },
];

export function SitesPageToolbar({
  cityOptions,
  city,
  query,
  sort,
  view,
  mapEnabled,
  type,
  typeOptions,
  totalCount,
  visibleCount,
  mapPointCount,
  mapColorMode,
  variant = "default",
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(variant === "default");

  function pushNext(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const queryString = params.toString();
    window.history.pushState(null, "", queryString ? `${pathname}?${queryString}` : pathname);
  }

  const showCitySelector = cityOptions.length > 1 || !cityOptions.some(o=>o.value===city);
  const showTypeSelector = typeOptions.length > 0 || type !== "all";
  const isMapPanel = variant === "mapPanel";
  const [activeSortKey, activeSortDirection] = sort.split("-") as [
    (typeof SORT_OPTIONS)[number]["key"],
    "asc" | "desc",
  ];

  function nextSortValue(key: (typeof SORT_OPTIONS)[number]["key"]): SitesSortValue {
    const direction = activeSortKey === key && activeSortDirection === "asc" ? "desc" : "asc";
    return `${key}-${direction}` as SitesSortValue;
  }

  const hasActiveFilters = Boolean(query.trim()) || type !== "all" || sort !== "activity-desc" || !cityOptions.some(o=>o.value===city);
  const activeFilterCount =
    (query.trim() ? 1 : 0) + (type !== "all" ? 1 : 0) + (sort !== "activity-desc" ? 1 : 0);
  const panelId = `sites-filters-${variant}`;
  const showMapColorToggle = view === "map";
  const filterSummary =
    activeFilterCount > 0 ? `Активно: ${activeFilterCount}` : "Поиск, тип и сортировка";

  function resetFilters() {
    pushNext({ q: null, type: null, sort: null, city: null });
  }

  const viewSwitcher = (
    <div className={cn("inline-flex w-full min-w-0 rounded-xl border border-white/10 bg-black/20 p-1", !isMapPanel && "sm:w-auto")}>
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon;
        const disabled = option.value === "map" && !mapEnabled;
        const active = view === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "inline-flex h-8 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm transition",
              !isMapPanel && "sm:min-w-24",
              active
                ? "bg-white/[0.12] text-foreground"
                : "text-muted-foreground hover:bg-white/[0.08] hover:text-foreground",
              disabled && "cursor-not-allowed opacity-45 hover:bg-transparent",
            )}
            aria-pressed={active}
            disabled={disabled}
            title={disabled ? "Добавьте координаты площадок для карты" : undefined}
            onClick={() => pushNext({ view: option.value })}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );

  const filtersPanel = (
    <div
      id={panelId}
      className={cn(
        "grid gap-3 border-white/10 border-t px-4 py-4",
        !filtersOpen && "hidden",
      )}
      aria-hidden={!filtersOpen}
    >
      <div
        className={cn(
          "grid gap-3",
          isMapPanel
            ? ""
            : showCitySelector && showTypeSelector
            ? "md:grid-cols-[minmax(12rem,16rem)_minmax(12rem,16rem)_minmax(0,1fr)]"
            : showCitySelector || showTypeSelector
              ? "md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]"
              : "",
        )}
      >
        {showCitySelector ? (
          <label className="grid gap-1.5 text-sm">
            <span className={cn("text-muted-foreground", variant === "mapPanel" && "text-xs")}>
              Город
            </span>
            <select
              value={city}
              onChange={(event) => pushNext({ city: event.target.value })}
              className="h-9 min-w-0 rounded-lg border border-white/10 bg-black/20 px-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              {!cityOptions.some(o=>o.value===city)&&<option value={city} disabled>Выбранный город — нет групп</option>}
              {cityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {showTypeSelector ? (
          <label className="grid gap-1.5 text-sm">
            <span className={cn("text-muted-foreground", variant === "mapPanel" && "text-xs")}>
              Тип
            </span>
            <select
              value={type}
              onChange={(event) =>
                pushNext({
                  type: event.target.value === "all" ? null : event.target.value,
                })
              }
              className="h-9 min-w-0 rounded-lg border border-white/10 bg-black/20 px-3 text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Все типы</option>
              {type!=="all"&&!typeOptions.some(o=>o.value===type)&&<option value={type} disabled>Выбранный тип — нет групп</option>}
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="grid gap-1.5 text-sm">
          <span className={cn("text-muted-foreground", variant === "mapPanel" && "text-xs")}>
            Поиск
          </span>
          <span className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => pushNext({ q: event.target.value.trim() || null })}
              placeholder="Название, адрес или метро"
              className="h-9 w-full min-w-0 rounded-lg border border-white/10 bg-black/20 pr-3 pl-9 text-foreground text-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </span>
        </label>
      </div>

      <fieldset className="grid gap-1.5" aria-label="Сортировка">
        <legend className={cn("text-muted-foreground text-sm", variant === "mapPanel" && "text-xs")}>
          Сортировка
        </legend>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => {
            const active = activeSortKey === option.key;
            const DirectionIcon = activeSortDirection === "desc" ? ArrowDown : ArrowUp;

            return (
              <button
                key={option.key}
                type="button"
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm transition",
                  active
                    ? "bg-white/[0.12] text-foreground"
                    : "bg-black/20 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground",
                )}
                aria-pressed={active}
                onClick={() => pushNext({ sort: nextSortValue(option.key) })}
              >
                {option.label}
                {active ? <DirectionIcon className="size-3.5" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {showMapColorToggle ? (
        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm">
          <span className="inline-flex min-w-0 items-center gap-2">
            <Palette className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block font-medium text-foreground">Цвета площадок</span>
              <span className="block text-muted-foreground text-xs">
                Перекрасить точки карты по площадкам
              </span>
            </span>
          </span>
          <input
            type="checkbox"
            checked={mapColorMode === "site"}
            onChange={(event) => pushNext({ mapColors: event.target.checked ? "site" : null })}
            className="size-4 accent-primary"
          />
        </label>
      ) : null}
    </div>
  );

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-card/45 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md",
        isMapPanel && "bg-white/[0.04]",
      )}
      aria-label="Фильтры площадок"
    >
      <div className={cn("grid gap-3 px-4 py-3", isMapPanel && "px-3")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="group/filter flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={filtersOpen}
            aria-controls={panelId}
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <SlidersHorizontal className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block font-medium text-sm">Фильтры</span>
              <span className="block text-muted-foreground text-xs">{filterSummary}</span>
            </span>
            <span
              className={cn(
                "ml-auto text-muted-foreground text-xs transition",
                filtersOpen && "rotate-180",
              )}
              aria-hidden
            >
              ↓
            </span>
          </button>

          {isMapPanel ? (
            <button
              type="button"
              className={cn(
                "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground",
                !hasActiveFilters && "pointer-events-none invisible",
              )}
              disabled={!hasActiveFilters}
              aria-hidden={!hasActiveFilters}
              aria-label="Сбросить фильтры"
              onClick={resetFilters}
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          ) : (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className={cn(
                  "inline-flex h-8 min-w-24 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm transition",
                  hasActiveFilters
                    ? "bg-black/20 text-foreground hover:bg-white/[0.08]"
                    : "pointer-events-none invisible bg-transparent text-muted-foreground",
                )}
                disabled={!hasActiveFilters}
                aria-hidden={!hasActiveFilters}
                onClick={resetFilters}
              >
                <RotateCcw className="size-4" aria-hidden />
                Сбросить
              </button>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-muted-foreground text-xs">
                {visibleCount} / {totalCount} найдено
                {view === "map" ? ` · ${mapPointCount} точек` : ""}
              </div>
            </div>
          )}
        </div>

        <div className={cn("grid gap-3", !isMapPanel && "sm:grid-cols-[minmax(0,1fr)] sm:items-center")}>
          {viewSwitcher}
        </div>
      </div>

      {filtersPanel}
    </section>
  );
}
