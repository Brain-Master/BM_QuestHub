"use client";

import { Activity, CalendarDays, LayoutList, List, MapPin, RotateCcw, Shapes, Users } from "lucide-react";

import { FilterDisclosure } from "@/components/filter-disclosure";
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
  hasActiveFilters,
  onReset,
}: Props) {
  const activeFiltersCount = [
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

  return (
    <FilterDisclosure
      data-testid="schedule-toolbar"
      title="Фильтры расписания"
      summary={summary}
      panelId="schedule-filter-panel"
      activeCount={activeFiltersCount}
      contentClassName={cn(
        "grid grid-cols-1 items-end gap-3 sm:grid-cols-2",
        showProgramFilter && showViewToggle
          ? "xl:grid-cols-5"
          : "xl:grid-cols-4",
      )}
    >
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
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label
          className={cn(
            "inline-flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-sm transition hover:bg-white/5",
            showProgramFilter && showViewToggle && "xl:col-start-4",
          )}
        >
          <input
            data-testid="schedule-archive-toggle"
            type="checkbox"
            className="size-4 accent-primary"
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
          />
          Архив
        </label>

        {showViewToggle ? (
          <div
            data-testid="schedule-view-toggle"
            className={cn(
              "hidden w-fit rounded-lg border border-white/10 bg-black/20 p-1 lg:inline-flex",
              showProgramFilter && "xl:col-start-5",
            )}
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
        ) : null}

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
    </FilterDisclosure>
  );
}
