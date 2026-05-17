"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronUp } from "lucide-react";

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
const ALL_PROGRAMS = "Все программы";
const ALL_SITES = "Все площадки";
const ALL_AGES = "Все возрасты";
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktopQuery(onStoreChange: () => void): () => void {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getServerDesktopSnapshot(): boolean {
  return true;
}

function formatShiftCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} смена`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} смены`;
  }
  return `${count} смен`;
}

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
  const [viewMode, setViewMode] = React.useState<ScheduleViewMode>("compact");
  const [status, setStatus] = React.useState(ALL_STATUSES);
  const [program, setProgram] = React.useState(ALL_PROGRAMS);
  const [site, setSite] = React.useState(ALL_SITES);
  const [age, setAge] = React.useState(ALL_AGES);
  const [showArchived, setShowArchived] = React.useState(false);
  const [expandedCardId, setExpandedCardId] = React.useState<string | null>(null);
  const [highlightedOfferId, setHighlightedOfferId] = React.useState<string | null>(null);
  const [showTopButton, setShowTopButton] = React.useState(false);
  const isDesktopLayout = React.useSyncExternalStore(
    subscribeToDesktopQuery,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  );
  const effectiveViewMode =
    viewMode === "compact" && !isDesktopLayout ? "detailed" : viewMode;

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

  const programs = React.useMemo(() => {
    const unique = Array.from(
      new Set(boardItems.map((item) => item.programFilterLabel)),
    ).sort((a, b) => a.localeCompare(b, "ru"));
    return [ALL_PROGRAMS, ...unique];
  }, [boardItems]);

  const sites = React.useMemo(() => {
    const unique = Array.from(new Set(boardItems.map((item) => item.venue.name))).sort(
      (a, b) => a.localeCompare(b, "ru"),
    );
    return [ALL_SITES, ...unique];
  }, [boardItems]);

  const ages = React.useMemo(() => {
    const unique = Array.from(
      new Set(
        boardItems.flatMap((item) => [
          item.commonAgeLabel,
          ...item.variants.map((variant) => variant.ageLabel),
        ]),
      ),
    )
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));

    return unique.length > 1 ? [ALL_AGES, ...unique] : [];
  }, [boardItems]);

  const showAgeFilter = ages.length > 0;
  const activeAge = showAgeFilter && ages.includes(age) ? age : ALL_AGES;

  const visibleItems = React.useMemo(() => {
    return boardItems.filter((item) => {
      if (!showArchived && item.status.isArchivedState) return false;
      if (status !== ALL_STATUSES && item.status.label !== status) return false;
      if (program !== ALL_PROGRAMS && item.programFilterLabel !== program) return false;
      if (!schoolSlug && site !== ALL_SITES && item.venue.name !== site) return false;
      if (showAgeFilter && activeAge !== ALL_AGES) {
        const itemAges = [
          item.commonAgeLabel,
          ...item.variants.map((variant) => variant.ageLabel),
        ].filter(Boolean);
        if (!itemAges.includes(activeAge)) return false;
      }
      return true;
    });
  }, [activeAge, boardItems, program, schoolSlug, showAgeFilter, showArchived, site, status]);

  const visibleGroups = React.useMemo(
    () => groupVisibleItems(groups, visibleItems),
    [groups, visibleItems],
  );

  const hasActiveFilters =
    showArchived ||
    status !== ALL_STATUSES ||
    program !== ALL_PROGRAMS ||
    (!schoolSlug && site !== ALL_SITES) ||
    (showAgeFilter && activeAge !== ALL_AGES);
  const resetFilters = () => {
    setShowArchived(false);
    setStatus(ALL_STATUSES);
    setProgram(ALL_PROGRAMS);
    setSite(ALL_SITES);
    setAge(ALL_AGES);
  };

  React.useEffect(() => {
    const onScroll = () => setShowTopButton(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const savedPath = sessionStorage.getItem("schedule:return:path");
    const savedY = sessionStorage.getItem("schedule:return:y");
    const savedOfferId = sessionStorage.getItem("schedule:return:offerId");
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if ((savedPath === currentPath && savedY) || savedOfferId) {
      window.requestAnimationFrame(() => {
        if (savedOfferId) setHighlightedOfferId(savedOfferId);
        if (!savedY || savedPath !== currentPath) return;
        window.scrollTo({ top: Number(savedY), behavior: "smooth" });
      });
    }
  }, []);

  const rememberNavigation = React.useCallback(
    (offerId: string) => {
      sessionStorage.setItem("schedule:return:path", window.location.pathname + window.location.search);
      sessionStorage.setItem("schedule:return:y", String(window.scrollY));
      sessionStorage.setItem("schedule:return:offerId", offerId);
      setHighlightedOfferId(offerId);
    },
    [],
  );

  return (
    <section className="schedule-board space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Расписание смен
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Найдено в выбранном интервале:{" "}
            <span className="font-medium text-foreground">
              {formatShiftCount(visibleItems.length)}
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
        program={program}
        programs={programs}
        onProgramChange={setProgram}
        site={site}
        sites={sites}
        onSiteChange={setSite}
        showSiteFilter={!schoolSlug}
        age={activeAge}
        ages={ages}
        onAgeChange={setAge}
        showAgeFilter={showAgeFilter}
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
        <ol className="relative space-y-8 before:absolute before:top-3 before:bottom-3 before:left-4 before:w-px before:bg-[color:var(--schedule-timeline-line)] lg:before:left-[12rem]">
          {visibleGroups.map((group) => (
            <li
              key={group.key}
              className="group/timeline relative grid gap-4 pl-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-6 lg:pl-0"
            >
              <div className="lg:pr-8 lg:text-right">
                <div className="absolute top-2 left-2 size-4 rounded-full border border-[color:var(--schedule-timeline-node)] bg-background shadow-[0_0_18px_color-mix(in_oklch,var(--schedule-timeline-node)_45%,transparent)] transition-transform before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-[color:var(--schedule-timeline-node)] before:opacity-30 group-hover/timeline:scale-125 lg:left-[11.5rem]" />
                <p className="font-heading text-lg font-semibold text-foreground">
                  {group.label}
                </p>
                <p className="mt-1 text-muted-foreground text-xs uppercase tracking-[0.16em]">
                  {group.items[0]?.shiftNumber ?? formatShiftCount(group.items.length)}
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
                    mode={effectiveViewMode}
                    schoolSlug={schoolSlug}
                    expanded={expandedCardId === item.offer.id}
                    highlighted={highlightedOfferId === item.offer.id}
                    onExpandChange={(expanded) =>
                      setExpandedCardId(expanded ? item.offer.id : null)
                    }
                    onNavigate={() => rememberNavigation(item.offer.id)}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        className={cn(
          "fixed right-5 bottom-5 z-40 inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-card/90 text-foreground shadow-lg backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-card",
          showTopButton ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Наверх"
      >
        <ChevronUp className="size-5" aria-hidden />
      </button>
    </section>
  );
}
