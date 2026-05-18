"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Grid2X2, List, MapPinned, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SitesSortValue =
  | "name-asc"
  | "name-desc"
  | "activity-desc"
  | "activity-asc"
  | "location-asc"
  | "location-desc";

export type SitesViewMode = "grid" | "list" | "map";

export type CityOption = {
  value: string;
  label: string;
};

type Props = {
  cityOptions: CityOption[];
  city: string;
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

export function SitesPageToolbar({
  cityOptions,
  city,
  sort,
  view,
  mapEnabled,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushNext(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const showCitySelector = cityOptions.length > 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-card/45 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md">
      <div
        className={cn(
          "grid gap-3 lg:items-end",
          showCitySelector
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(13rem,16rem)_auto]"
            : "lg:grid-cols-[minmax(13rem,16rem)_auto]",
        )}
      >
        {showCitySelector ? (
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Город</span>
            <select
              value={city}
              onChange={(event) => pushNext({ city: event.target.value })}
              className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
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
          <span className="text-muted-foreground">Сортировка</span>
          <select
            value={sort}
            onChange={(event) =>
              pushNext({ sort: event.target.value as SitesSortValue })
            }
            className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="name-asc">По имени: А-Я</option>
            <option value="name-desc">По имени: Я-А</option>
            <option value="activity-desc">По активности: больше</option>
            <option value="activity-asc">По активности: меньше</option>
            <option value="location-asc">По локации: А-Я</option>
            <option value="location-desc">По локации: Я-А</option>
          </select>
        </label>

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
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm transition",
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
    </div>
  );
}
