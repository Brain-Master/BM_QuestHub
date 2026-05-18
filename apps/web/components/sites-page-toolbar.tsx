"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Grid2X2,
  List,
  MapPinned,
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

export type CityOption = {
  value: string;
  label: string;
};

type Props = {
  cityOptions: CityOption[];
  city: string;
  query: string;
  sort: SitesSortValue;
  view: SitesViewMode;
  mapEnabled: boolean;
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
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushNext(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const showCitySelector = cityOptions.length > 1;
  const [activeSortKey, activeSortDirection] = sort.split("-") as [
    (typeof SORT_OPTIONS)[number]["key"],
    "asc" | "desc",
  ];

  function nextSortValue(key: (typeof SORT_OPTIONS)[number]["key"]): SitesSortValue {
    const direction = activeSortKey === key && activeSortDirection === "asc" ? "desc" : "asc";
    return `${key}-${direction}` as SitesSortValue;
  }

  return (
    <details
      open
      className="group rounded-2xl border border-white/10 bg-card/45 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <span className="inline-flex items-center gap-2 font-medium text-sm">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden />
          Фильтры
        </span>
        <span className="text-muted-foreground text-xs transition group-open:rotate-180" aria-hidden>
          ↓
        </span>
      </summary>

      <div className="grid gap-3 border-white/10 border-t px-4 py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div
            className={cn(
              "grid gap-3",
              showCitySelector ? "md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]" : "",
            )}
          >
            {showCitySelector ? (
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Город</span>
                <select
                  value={city}
                  onChange={(event) => pushNext({ city: event.target.value })}
                  className="h-9 rounded-lg border border-white/10 bg-black/20 px-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {cityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Поиск</span>
              <span className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  value={query}
                  onChange={(event) => pushNext({ q: event.target.value.trim() || null })}
                  placeholder="Название, адрес или метро"
                  className="h-9 w-full rounded-lg border border-white/10 bg-black/20 pr-3 pl-9 text-foreground text-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </span>
            </label>
          </div>

          <div className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Вид</span>
            <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;
                const disabled = option.value === "map" && !mapEnabled;
                const active = view === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm transition",
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
                    <Icon className="size-4" aria-hidden />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <fieldset className="grid gap-2" aria-label="Сортировка">
          <legend className="text-muted-foreground text-sm">Сортировка</legend>
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
      </div>
    </details>
  );
}
