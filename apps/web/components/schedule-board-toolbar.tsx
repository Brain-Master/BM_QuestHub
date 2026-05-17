"use client";

import { LayoutList, List, RotateCcw } from "lucide-react";

import type { ScheduleViewMode } from "@/components/schedule-board-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  status: string;
  statuses: string[];
  onStatusChange: (status: string) => void;
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
  showArchived,
  onShowArchivedChange,
  hasActiveFilters,
  onReset,
}: Props) {
  return (
    <div
      data-testid="schedule-toolbar"
      className="flex flex-col gap-4 rounded-2xl border border-[color:var(--schedule-card-border)] bg-[color:var(--schedule-toolbar-bg)] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md md:flex-row md:items-center md:justify-between"
    >
      <div>
        <p className="font-heading font-semibold text-lg">Фильтры расписания</p>
        <p className="text-muted-foreground text-sm">
          Сравните смены по статусу, датам и формату отображения.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onValueChange={(value) => {
            if (value) onStatusChange(value);
          }}
        >
          <SelectTrigger
            data-testid="schedule-status-filter"
            className="w-full min-w-44 border-white/10 bg-black/20 sm:w-52"
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

        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-sm transition hover:bg-white/5">
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
          className="inline-flex rounded-lg border border-white/10 bg-black/20 p-1"
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

        {hasActiveFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" aria-hidden />
            Сбросить
          </Button>
        ) : null}
      </div>
    </div>
  );
}
