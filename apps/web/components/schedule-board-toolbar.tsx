"use client";

import * as React from "react";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  LayoutList,
  List,
  MapPin,
  RotateCcw,
  Search,
  Shapes,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { ProgramFilterSelect } from "@/components/program-filter-select";
import type { ScheduleViewMode } from "@/components/schedule-board-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_PROGRAM_FILTER_VALUE, type ProgramFilterGroup } from "@/lib/program-filter-options";
import { cn } from "@/lib/utils";

type Props = {
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  query: string;
  onQueryChange: (query: string) => void;
  status: string;
  statuses: string[];
  onStatusChange: (status: string) => void;
  program: string;
  programGroups: ProgramFilterGroup[];
  onProgramChange: (program: string) => void;
  showProgramFilter?: boolean;
  site: string;
  sites: string[];
  onSiteChange: (site: string) => void;
  showSiteFilter: boolean;
  format: string;
  formats: string[];
  onFormatChange: (format: string) => void;
  age: string;
  ages: string[];
  onAgeChange: (age: string) => void;
  showAgeFilter: boolean;
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;
  showViewToggle?: boolean;
  totalCount: number;
  visibleCount: number;
  hasActiveFilters: boolean;
  onReset: () => void;
};

export function ScheduleBoardToolbar({
  viewMode,
  onViewModeChange,
  query,
  onQueryChange,
  status,
  statuses,
  onStatusChange,
  program,
  programGroups,
  onProgramChange,
  showProgramFilter = true,
  site,
  sites,
  onSiteChange,
  showSiteFilter,
  format,
  formats,
  onFormatChange,
  age,
  ages,
  onAgeChange,
  showAgeFilter,
  showArchived,
  onShowArchivedChange,
  showViewToggle = true,
  totalCount,
  visibleCount,
  hasActiveFilters,
  onReset,
}: Props) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const activeFiltersCount = [
    query.trim(),
    showProgramFilter && program !== ALL_PROGRAM_FILTER_VALUE,
    showSiteFilter && site !== sites[0],
    format !== formats[0],
    showAgeFilter && age !== ages[0],
    status !== statuses[0],
    showArchived,
  ].filter(Boolean).length;
  const summary = [
    showProgramFilter ? "программа" : null,
    showSiteFilter ? "площадка" : null,
    "формат",
    showAgeFilter ? "возраст" : null,
    "статус",
  ]
    .filter(Boolean)
    .join(", ");
  const panelId = "schedule-filter-panel";
  const filterSummary =
    activeFiltersCount > 0 ? `Активно: ${activeFiltersCount}` : `Поиск, ${summary}`;
  const viewSwitcher = showViewToggle ? (
    <div
      data-testid="schedule-view-toggle"
      className="inline-flex w-full min-w-0 rounded-xl border border-white/10 bg-black/20 p-1 sm:w-auto"
    >
      <Button
        type="button"
        size="sm"
        variant={viewMode === "detailed" ? "secondary" : "ghost"}
        className="min-w-0 flex-1 gap-1.5 px-2 sm:min-w-28"
        aria-pressed={viewMode === "detailed"}
        aria-label="Подробный вид"
        onClick={() => onViewModeChange("detailed")}
      >
        <LayoutList className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Подробно</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant={viewMode === "compact" ? "secondary" : "ghost"}
        className="min-w-0 flex-1 gap-1.5 px-2 sm:min-w-28"
        aria-pressed={viewMode === "compact"}
        aria-label="Компактный вид"
        onClick={() => onViewModeChange("compact")}
      >
        <List className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Компактно</span>
      </Button>
    </div>
  ) : null;

  return (
    <section
      data-testid="schedule-toolbar"
      className="rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-toolbar-bg)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md"
      aria-label="Фильтры расписания"
    >
      <div className="grid gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="group/filter flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Фильтры расписания"
            aria-expanded={filtersOpen}
            aria-controls={panelId}
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <SlidersHorizontal className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block font-heading font-semibold text-lg">Фильтры</span>
              <span className="block text-muted-foreground text-sm">{filterSummary}</span>
            </span>
            <ChevronDown
              className={cn(
                "ml-auto size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/filter:text-foreground",
                filtersOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              data-testid="schedule-reset-filter"
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={!hasActiveFilters}
              className={cn(
                "min-w-24 border-white/10 bg-transparent hover:bg-white/5",
                !hasActiveFilters && "pointer-events-none invisible",
              )}
              aria-hidden={!hasActiveFilters}
              tabIndex={hasActiveFilters ? 0 : -1}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Сбросить
            </Button>
            <div
              data-testid="schedule-results-count"
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-muted-foreground text-xs"
            >
              {visibleCount} / {totalCount} найдено
            </div>
          </div>
        </div>

        {viewSwitcher ? <div className="grid gap-3 sm:items-center">{viewSwitcher}</div> : null}
      </div>

      <div
        id={panelId}
        className={cn(
          "grid grid-cols-1 items-end gap-3 border-white/10 border-t px-4 py-4 sm:grid-cols-2",
          showProgramFilter ? "xl:grid-cols-4" : "xl:grid-cols-3",
          !filtersOpen && "hidden",
        )}
        aria-hidden={!filtersOpen}
      >
        <label className="grid gap-2 text-sm sm:col-span-2 xl:col-span-full">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Search className="size-4 opacity-80" aria-hidden />
            Поиск
          </span>
          <span className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              data-testid="schedule-search-filter"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Квест, площадка, дата или статус"
              className="h-9 w-full min-w-0 rounded-lg border border-white/10 bg-black/20 pr-3 pl-9 text-foreground text-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </span>
        </label>

        {showProgramFilter ? (
          <label className="grid gap-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Shapes className="size-4 opacity-80" aria-hidden />
              Программа
            </span>
            <ProgramFilterSelect
              value={program}
              groups={programGroups}
              onValueChange={(value) => {
                if (value) onProgramChange(value);
              }}
              triggerTestId="schedule-program-filter"
            />
          </label>
        ) : null}

        {showSiteFilter ? (
          <label className="grid gap-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 opacity-80" aria-hidden />
              Площадка
            </span>
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
                {!sites.includes(site) && <SelectItem value={site} disabled>{site} — нет групп</SelectItem>}
                {sites.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}

        <label className="grid gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4 opacity-80" aria-hidden />
            Формат
          </span>
          <Select
            value={format}
            onValueChange={(value) => {
              if (value) onFormatChange(value);
            }}
          >
            <SelectTrigger
              data-testid="schedule-format-filter"
              className="w-full border-white/10 bg-black/20"
            >
              <SelectValue placeholder="Формат" />
            </SelectTrigger>
            <SelectContent>
              {!formats.includes(format) && <SelectItem value={format} disabled>{format} — нет групп</SelectItem>}
              {formats.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {showAgeFilter ? (
          <label className="grid gap-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4 opacity-80" aria-hidden />
              Возраст
            </span>
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
                {!ages.includes(age) && <SelectItem value={age} disabled>{age} — нет групп</SelectItem>}
                {ages.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}

        <label className="grid gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Activity className="size-4 opacity-80" aria-hidden />
            Статус
          </span>
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
              {!statuses.includes(status) && <SelectItem value={status} disabled>{status} — нет групп</SelectItem>}
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="inline-flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-sm transition hover:bg-white/5">
          <input
            data-testid="schedule-archive-toggle"
            type="checkbox"
            className="size-4 accent-primary"
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
          />
          Архив
        </label>
      </div>
    </section>
  );
}
