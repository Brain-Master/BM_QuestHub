"use client";

import * as React from "react";
import { ChevronDown, LayoutList, List, RotateCcw } from "lucide-react";

import type { ScheduleViewMode } from "@/components/schedule-board-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  status: string;
  statuses: string[];
  onStatusChange: (status: string) => void;
  program: string;
  programs: string[];
  onProgramChange: (program: string) => void;
  site: string;
  sites: string[];
  onSiteChange: (site: string) => void;
  showSiteFilter: boolean;
  age: string;
  ages: string[];
  onAgeChange: (age: string) => void;
  showAgeFilter: boolean;
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
};

export function ScheduleBoardToolbar({
  viewMode,
  onViewModeChange,
  status,
  statuses,
  onStatusChange,
  program,
  programs,
  onProgramChange,
  site,
  sites,
  onSiteChange,
  showSiteFilter,
  age,
  ages,
  onAgeChange,
  showAgeFilter,
  showArchived,
  onShowArchivedChange,
  hasActiveFilters,
  onReset,
}: Props) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const activeFiltersCount = [
    program !== programs[0],
    showSiteFilter && site !== sites[0],
    showAgeFilter && age !== ages[0],
    status !== statuses[0],
    showArchived,
  ].filter(Boolean).length;

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const syncOpenState = () => setFiltersOpen(media.matches);
    syncOpenState();
    media.addEventListener("change", syncOpenState);
    return () => media.removeEventListener("change", syncOpenState);
  }, []);

  return (
    <div
      data-testid="schedule-toolbar"
      className="rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-toolbar-bg)] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="group/filter flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-expanded={filtersOpen}
          aria-controls="schedule-filter-panel"
          onClick={() => setFiltersOpen((value) => !value)}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-heading font-semibold text-lg">
              Фильтры расписания
            </span>
            <span className="text-muted-foreground text-sm">
              {activeFiltersCount > 0
                ? `Активно: ${activeFiltersCount}`
                : "Программа, площадка, возраст, статус"}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/filter:text-foreground",
              filtersOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <div className="hidden rounded-full border border-white/10 bg-black/20 px-3 py-1 text-muted-foreground text-xs lg:block">
          {filtersOpen ? "Свернуть" : "Показать фильтры"}
        </div>
      </div>

      <div
        id="schedule-filter-panel"
        className={cn(
          "w-full grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:grid-cols-4",
          filtersOpen
            ? "mt-4 grid opacity-100"
            : "hidden opacity-0 pointer-events-none",
        )}
        aria-hidden={!filtersOpen}
      >
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-hidden sm:col-span-2 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-4">
        <Select
          value={program}
          onValueChange={(value) => {
            if (value) onProgramChange(value);
          }}
        >
          <SelectTrigger
            data-testid="schedule-program-filter"
            className="w-full border-white/10 bg-black/20"
          >
            <SelectValue placeholder="Программа" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showSiteFilter ? (
          <Select
            value={site}
            onValueChange={(value) => {
              if (value) onSiteChange(value);
            }}
          >
            <SelectTrigger
              data-testid="schedule-site-filter"
              className="w-full border-white/10 bg-black/20"
            >
              <SelectValue placeholder="Площадка" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {showAgeFilter ? (
          <Select
            value={age}
            onValueChange={(value) => {
              if (value) onAgeChange(value);
            }}
          >
            <SelectTrigger
              data-testid="schedule-age-filter"
              className="w-full border-white/10 bg-black/20"
            >
              <SelectValue placeholder="Возраст" />
            </SelectTrigger>
            <SelectContent>
              {ages.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Select
          value={status}
          onValueChange={(value) => {
            if (value) onStatusChange(value);
          }}
        >
          <SelectTrigger
            data-testid="schedule-status-filter"
            className="w-full border-white/10 bg-black/20"
          >
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="inline-flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-sm transition hover:bg-white/5 xl:col-start-3">
          <input
            data-testid="schedule-archive-toggle"
            type="checkbox"
            className="size-4 accent-primary"
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
          />
          Архив
        </label>

        <div
          data-testid="schedule-view-toggle"
          className="hidden w-fit rounded-lg border border-white/10 bg-black/20 p-1 lg:inline-flex xl:col-start-4"
        >
          <Button
            type="button"
            size="icon-sm"
            variant={viewMode === "detailed" ? "secondary" : "ghost"}
            aria-label="Подробный вид"
            onClick={() => onViewModeChange("detailed")}
          >
            <LayoutList className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={viewMode === "compact" ? "secondary" : "ghost"}
            aria-label="Компактный вид"
            onClick={() => onViewModeChange("compact")}
          >
            <List className="size-4" aria-hidden />
          </Button>
        </div>

        <Button
          type="button"
          data-testid="schedule-reset-filter"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className={!hasActiveFilters ? "hidden" : undefined}
          aria-hidden={!hasActiveFilters}
          tabIndex={hasActiveFilters ? 0 : -1}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Сбросить
        </Button>
        </div>
      </div>
    </div>
  );
}
