"use client";

import Link from "next/link";
import * as React from "react";

import { ScheduleBoardCard, type ScheduleViewMode } from "@/components/schedule-board-card";
import { ScheduleBoardToolbar } from "@/components/schedule-board-toolbar";
import { buttonVariants } from "@/components/ui/button";
import type { AgendaOfferGroup } from "@/lib/offers/agenda";
import {
  buildScheduleBoardItem,
  type ScheduleBoardItem,
} from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  groups: AgendaOfferGroup[];
  schoolSlug?: string;
  catalogHref: string;
  allAgendaHref?: string;
  sitesHref?: string;
};

const ALL_STATUSES = "Все статусы";

function groupVisibleItems(
  source: AgendaOfferGroup[],
  items: ScheduleBoardItem[],
): Array<{ key: string; label: string; items: ScheduleBoardItem[] }> {
  const itemById = new Map(items.map((item) => [item.offer.id, item]));
  return source
    .map((group) => ({
      key: group.key,
      label: group.label,
      items: group.items
        .map((item) => itemById.get(item.offer.id))
        .filter((item): item is ScheduleBoardItem => Boolean(item)),
    }))
    .filter((group) => group.items.length > 0);
}

export function ScheduleBoard({
  groups,
  schoolSlug,
  catalogHref,
  allAgendaHref,
  sitesHref = "/sites",
}: Props) {
  const [viewMode, setViewMode] = React.useState<ScheduleViewMode>("detailed");
  const [status, setStatus] = React.useState(ALL_STATUSES);
  const [showArchived, setShowArchived] = React.useState(false);

  const boardItems = React.useMemo(
    () =>
      groups.flatMap((group) =>
        group.items.map((item) => buildScheduleBoardItem(item, schoolSlug)),
      ),
    [groups, schoolSlug],
  );

  const statuses = React.useMemo(() => {
    const unique = Array.from(new Set(boardItems.map((item) => item.status.label)));
    return [ALL_STATUSES, ...unique];
  }, [boardItems]);

  const visibleItems = React.useMemo(() => {
    return boardItems.filter((item) => {
      if (!showArchived && item.status.isArchivedState) return false;
      if (status !== ALL_STATUSES && item.status.label !== status) return false;
      return true;
    });
  }, [boardItems, showArchived, status]);

  const visibleGroups = React.useMemo(
    () => groupVisibleItems(groups, visibleItems),
    [groups, visibleItems],
  );

  const hasActiveFilters = showArchived || status !== ALL_STATUSES;
  const resetFilters = () => {
    setShowArchived(false);
    setStatus(ALL_STATUSES);
  };

  return (
    <section className="schedule-board space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Расписание смен
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Смен в расписании:{" "}
            <span className="font-medium text-foreground">
              {visibleItems.length}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={catalogHref}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "border border-white/10 bg-white/5 hover:bg-white/10",
            )}
          >
            Перейти в каталог
          </Link>
          {allAgendaHref ? (
            <Link
              href={allAgendaHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 bg-transparent hover:bg-white/5",
              )}
            >
              Показать все площадки
            </Link>
          ) : (
            <Link
              href={sitesHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 bg-transparent hover:bg-white/5",
              )}
            >
              Выбрать площадку
            </Link>
          )}
        </div>
      </div>

      <ScheduleBoardToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        status={status}
        statuses={statuses}
        onStatusChange={setStatus}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      {visibleGroups.length === 0 ? (
        <div
          data-testid="schedule-empty-state"
          className="rounded-2xl border border-dashed border-white/15 bg-card/30 px-6 py-16 text-center"
        >
          <p className="text-lg text-muted-foreground">
            Для выбранных фильтров пока нет смен.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                className={buttonVariants({ variant: "outline" })}
                onClick={resetFilters}
              >
                Сбросить фильтры
              </button>
            ) : null}
            <Link href={sitesHref} className={buttonVariants({ variant: "default" })}>
              Выбрать площадку
            </Link>
          </div>
        </div>
      ) : (
        <ol className="relative space-y-8 before:absolute before:top-3 before:bottom-3 before:left-4 before:w-px before:bg-[color:var(--schedule-timeline-line)] md:before:left-[7.5rem]">
          {visibleGroups.map((group) => (
            <li
              key={group.key}
              className="relative grid gap-4 pl-10 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6 md:pl-0"
            >
              <div className="md:text-right">
                <div className="absolute top-2 left-2 size-4 rounded-full border border-[color:var(--schedule-timeline-node)] bg-background shadow-[0_0_18px_color-mix(in_oklch,var(--schedule-timeline-node)_45%,transparent)] md:left-[7rem]" />
                <p className="font-heading text-lg font-semibold text-foreground">
                  {group.label}
                </p>
                <p className="mt-1 text-muted-foreground text-xs uppercase tracking-[0.16em]">
                  {group.items.length} смен
                </p>
              </div>

              <div
                className={cn(
                  "grid",
                  viewMode === "compact" ? "gap-5" : "gap-8",
                )}
              >
                {group.items.map((item) => (
                  <ScheduleBoardCard
                    key={item.offer.id}
                    item={item}
                    mode={viewMode}
                    schoolSlug={schoolSlug}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
