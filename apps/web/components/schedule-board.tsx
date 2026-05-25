"use client";

import Link from "next/link";
import * as React from "react";
import { flushSync } from "react-dom";

import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { MosCapacityDataNotice } from "@/components/mos-capacity-data-notice";
import { ScheduleBoardCard, type ScheduleViewMode } from "@/components/schedule-board-card";
import { ScheduleBoardToolbar } from "@/components/schedule-board-toolbar";
import { buttonVariants } from "@/components/ui/button";
import type { AgendaOfferGroup } from "@/lib/offers/agenda";
import {
  buildScheduleBoardItem,
  type ScheduleBoardItem,
} from "@/lib/offers/schedule-board";
import {
  ALL_PROGRAM_FILTER_VALUE,
  buildProgramFilterGroups,
  parseProgramFilterValue,
} from "@/lib/program-filter-options";
import { PREFERRED_SCHOOL_STORAGE_KEY } from "@/lib/preferred-school";
import { venueVisibleForSchoolScope } from "@/lib/school-scope";
import { buildSiteHref } from "@/lib/sites/site-route";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import { cn } from "@/lib/utils";

type Props = {
  groups: AgendaOfferGroup[];
  schoolSlug?: string;
  schoolName?: string;
  allAgendaHref?: string;
  sitesHref?: string;
  title?: string;
  description?: string;
  showProgramFilter?: boolean;
  displayMode?: "agenda" | "quest";
  snapshotGeneratedAt?: string | null;
  showSnapshotTime?: boolean;
  hideTitle?: boolean;
  hideCommunityPanel?: boolean;
};

const ALL_STATUSES = "Все статусы";
const ALL_SITES = "Все площадки";
const ALL_FORMATS = "Все форматы";
const ALL_AGES = "Все возрасты";
const QUERY_SITE = "__query_site__";
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
  return false;
}

function subscribeToSearchParams(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getSearchSnapshot(): string {
  return window.location.search;
}

function getServerSearchSnapshot(): string {
  return "";
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

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

function itemFormatTypes(item: ScheduleBoardItem): string[] {
  const formats = item.variants.length
    ? item.variants.map((variant) => variant.type)
    : [item.formatType];
  return Array.from(new Set(formats.filter(Boolean)));
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase("ru");
}

function scheduleItemMatchesQuery(item: ScheduleBoardItem, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = [
    item.displayTitle,
    item.programNameH1,
    item.programNameH2,
    item.programFilterLabel,
    item.quest.title,
    item.world?.name,
    item.venue.name,
    item.venue.displayName,
    item.formatType,
    item.formatNote,
    item.commonAgeLabel,
    item.status.label,
    item.shiftNumber,
    item.timelineDateLabel,
    item.shortDateLabel,
    item.dateLabel,
    item.timeLabel,
    item.offer.startDate,
    item.offer.endDate,
    ...item.variants.flatMap((variant) => [
      variant.type,
      variant.time,
      variant.ageLabel,
      variant.note,
    ]),
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeSearchText)
    .join(" ");

  return normalizedQuery
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

export function ScheduleBoard({
  groups,
  schoolSlug,
  schoolName,
  allAgendaHref,
  sitesHref = "/sites",
  title,
  description,
  showProgramFilter = true,
  displayMode = "agenda",
  snapshotGeneratedAt = null,
  showSnapshotTime = false,
  hideTitle = false,
  hideCommunityPanel = false,
}: Props) {
  const [viewMode, setViewMode] = React.useState<ScheduleViewMode>("compact");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState(ALL_STATUSES);
  const [program, setProgram] = React.useState(ALL_PROGRAM_FILTER_VALUE);
  const [site, setSite] = React.useState(QUERY_SITE);
  const [format, setFormat] = React.useState(ALL_FORMATS);
  const [age, setAge] = React.useState(ALL_AGES);
  const [showArchived, setShowArchived] = React.useState(false);
  const [expandedCardId, setExpandedCardId] = React.useState<string | null>(null);
  const [rememberedHighlightedOfferId, setRememberedHighlightedOfferId] = React.useState<
    string | null
  >(null);
  const pendingMobileOpenTimeout = React.useRef<number | null>(null);
  const pendingMobileScrollFrame = React.useRef<number | null>(null);
  const isDesktopLayout = React.useSyncExternalStore(
    subscribeToDesktopQuery,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  );
  const currentSearch = React.useSyncExternalStore(
    subscribeToSearchParams,
    getSearchSnapshot,
    getServerSearchSnapshot,
  );
  const queryParams = React.useMemo(() => new URLSearchParams(currentSearch), [currentSearch]);
  const querySchoolSlug = queryParams.get("school")?.trim() || undefined;
  const queryOfferId = queryParams.get("offer")?.trim() || undefined;
  const highlightedOfferId = queryOfferId ?? rememberedHighlightedOfferId;
  const isQuestDisplay = displayMode === "quest";
  const effectiveViewMode = isQuestDisplay ? "quest" : isDesktopLayout ? viewMode : "mobile";

  const boardItems = React.useMemo(
    () =>
      groups.flatMap((group) =>
        group.items.map((item) =>
          buildScheduleBoardItem(item, querySchoolSlug ?? schoolSlug),
        ),
      ),
    [groups, querySchoolSlug, schoolSlug],
  );

  const statuses = React.useMemo(() => {
    const unique = Array.from(new Set(boardItems.map((item) => item.status.label)));
    return [ALL_STATUSES, ...unique];
  }, [boardItems]);

  const programGroups = React.useMemo(() => {
    return buildProgramFilterGroups(
      boardItems.map((item) => ({
        slug: item.quest.slug,
        title: item.quest.title,
        worldSlug: item.quest.worldSlug,
        worldName: item.world?.name,
        programLabel: item.programFilterLabel,
      })),
    );
  }, [boardItems]);

  const sites = React.useMemo(() => {
    const unique = Array.from(new Set(boardItems.map((item) => item.venue.name))).sort(
      (a, b) => a.localeCompare(b, "ru"),
    );
    return [ALL_SITES, ...unique];
  }, [boardItems]);
  const querySite = React.useMemo(() => {
    if (!querySchoolSlug || schoolSlug) return undefined;
    return (
      boardItems.find((item) => item.venue.schoolScopeSlug === querySchoolSlug) ??
      boardItems.find((item) => venueVisibleForSchoolScope(item.venue, querySchoolSlug))
    )?.venue.name;
  }, [boardItems, querySchoolSlug, schoolSlug]);
  const activeSite =
    site === QUERY_SITE && querySite && sites.includes(querySite)
      ? querySite
      : sites.includes(site)
        ? site
        : ALL_SITES;
  const bookingSchoolSlug = schoolSlug ?? querySchoolSlug;

  const formats = React.useMemo(() => {
    const unique = Array.from(new Set(boardItems.flatMap(itemFormatTypes))).sort((a, b) =>
      a.localeCompare(b, "ru"),
    );
    return [ALL_FORMATS, ...unique];
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
    const selectedProgram = parseProgramFilterValue(program);
    return boardItems.filter((item) => {
      if (!showArchived && status === ALL_STATUSES && item.status.isArchivedState) {
        return false;
      }
      if (status !== ALL_STATUSES && item.status.label !== status) return false;
      if (!scheduleItemMatchesQuery(item, query)) return false;
      if (showProgramFilter) {
        if (selectedProgram.kind === "series" && item.quest.worldSlug !== selectedProgram.slug) {
          return false;
        }
        if (selectedProgram.kind === "quest" && item.quest.slug !== selectedProgram.slug) {
          return false;
        }
      }
      if (!schoolSlug && activeSite !== ALL_SITES && item.venue.name !== activeSite) return false;
      if (format !== ALL_FORMATS && !itemFormatTypes(item).includes(format)) return false;
      if (showAgeFilter && activeAge !== ALL_AGES) {
        const itemAges = [
          item.commonAgeLabel,
          ...item.variants.map((variant) => variant.ageLabel),
        ].filter(Boolean);
        if (!itemAges.includes(activeAge)) return false;
      }
      return true;
    });
  }, [
    activeAge,
    activeSite,
    boardItems,
    format,
    program,
    query,
    schoolSlug,
    showAgeFilter,
    showArchived,
    showProgramFilter,
    status,
  ]);

  const visibleGroups = React.useMemo(
    () => groupVisibleItems(groups, visibleItems),
    [groups, visibleItems],
  );

  const hasActiveFilters =
    Boolean(query.trim()) ||
    showArchived ||
    status !== ALL_STATUSES ||
    (showProgramFilter && program !== ALL_PROGRAM_FILTER_VALUE) ||
    (!schoolSlug && activeSite !== ALL_SITES) ||
    format !== ALL_FORMATS ||
    (showAgeFilter && activeAge !== ALL_AGES);
  const resetFilters = () => {
    setQuery("");
    setShowArchived(false);
    setStatus(ALL_STATUSES);
    setProgram(ALL_PROGRAM_FILTER_VALUE);
    setSite(ALL_SITES);
    setFormat(ALL_FORMATS);
    setAge(ALL_AGES);
  };

  React.useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    sessionStorage.removeItem("schedule:return:y");

    const savedPath = sessionStorage.getItem("schedule:return:path");
    const savedOfferId = sessionStorage.getItem("schedule:return:offerId");
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (!queryOfferId && savedPath === currentPath && savedOfferId) {
      window.requestAnimationFrame(() => setRememberedHighlightedOfferId(savedOfferId));
    }

    return () => {
      window.history.scrollRestoration = previousRestoration;
      if (pendingMobileOpenTimeout.current) {
        window.clearTimeout(pendingMobileOpenTimeout.current);
      }
      if (pendingMobileScrollFrame.current) {
        window.cancelAnimationFrame(pendingMobileScrollFrame.current);
      }
    };
  }, [queryOfferId]);

  const rememberNavigation = React.useCallback(
    (offerId: string) => {
      sessionStorage.setItem("schedule:return:path", window.location.pathname + window.location.search);
      sessionStorage.setItem("schedule:return:offerId", offerId);
      setRememberedHighlightedOfferId(offerId);
    },
    [],
  );

  const changeExpandedCard = React.useCallback(
    (offerId: string, expanded: boolean, anchor: HTMLElement | null) => {
      if (pendingMobileOpenTimeout.current) {
        window.clearTimeout(pendingMobileOpenTimeout.current);
        pendingMobileOpenTimeout.current = null;
      }
      if (pendingMobileScrollFrame.current) {
        window.cancelAnimationFrame(pendingMobileScrollFrame.current);
        pendingMobileScrollFrame.current = null;
      }

      if (isDesktopLayout || !expanded) {
        setExpandedCardId(expanded ? offerId : null);
        return;
      }

      const card = anchor?.closest<HTMLElement>("[data-testid='schedule-card']");
      if (!card) {
        setExpandedCardId(offerId);
        return;
      }

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const targetTop = Math.min(
        maxScroll,
        Math.max(0, card.getBoundingClientRect().top + window.scrollY - 96),
      );
      const startTop = window.scrollY;
      const distance = targetTop - startTop;
      const duration = Math.min(620, Math.max(320, Math.abs(distance) * 0.65));
      const startedAt = performance.now();

      const finishOpen = () => {
        flushSync(() => setExpandedCardId(offerId));
        const startedCorrectionAt = performance.now();
        const correctToTarget = () => {
          const delta = card.getBoundingClientRect().top - 96;
          if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
          if (performance.now() - startedCorrectionAt < 420) {
            window.requestAnimationFrame(correctToTarget);
          }
        };
        correctToTarget();
        window.setTimeout(correctToTarget, 460);
        window.setTimeout(correctToTarget, 900);
        pendingMobileOpenTimeout.current = null;
        pendingMobileScrollFrame.current = null;
      };

      const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        window.scrollTo(0, startTop + distance * easeInOutCubic(progress));
        if (progress < 1) {
          pendingMobileScrollFrame.current = window.requestAnimationFrame(step);
          return;
        }
        pendingMobileOpenTimeout.current = window.setTimeout(finishOpen, 80);
      };

      pendingMobileScrollFrame.current = window.requestAnimationFrame(step);
    },
    [isDesktopLayout],
  );

  return (
    <section className="schedule-board space-y-8 [overflow-anchor:none]">
      <MosCapacityDataNotice
        snapshotGeneratedAt={snapshotGeneratedAt}
        showSnapshotTime={showSnapshotTime}
      />
      {hideTitle ? null : (
        <div className="flex flex-col items-start justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {title ?? (
              schoolName && schoolSlug ? (
                <>
                  Расписание:{" "}
                  <Link
                    href={buildSiteHref(schoolSlug)}
                    className="rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {schoolName}
                  </Link>
                </>
              ) : (
                "Расписание смен"
              )
            )}
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            {description ? `${description} ` : schoolName ? "Площадка зафиксирована. " : null}
            Показано:{" "}
            <span className="font-medium text-foreground">
              {formatShiftCount(visibleItems.length)}
            </span>
          </p>
        </div>
        {allAgendaHref ? (
          <Link
            href={allAgendaHref}
            onClick={() => localStorage.removeItem(PREFERRED_SCHOOL_STORAGE_KEY)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full border-white/10 bg-transparent hover:bg-white/5 sm:w-auto",
            )}
          >
            Посмотреть смены всех площадок
          </Link>
        ) : null}
        </div>
      )}

      {hideTitle && allAgendaHref ? (
        <div className="flex justify-end border-b border-white/10 pb-4">
          <Link
            href={allAgendaHref}
            onClick={() => localStorage.removeItem(PREFERRED_SCHOOL_STORAGE_KEY)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10 bg-transparent hover:bg-white/5",
            )}
          >
            Посмотреть смены всех площадок
          </Link>
        </div>
      ) : null}

      <ScheduleBoardToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        query={query}
        onQueryChange={setQuery}
        status={status}
        statuses={statuses}
        onStatusChange={setStatus}
        program={program}
        programGroups={programGroups}
        onProgramChange={setProgram}
        showProgramFilter={showProgramFilter}
        site={activeSite}
        sites={sites}
        onSiteChange={setSite}
        showSiteFilter={!schoolSlug}
        format={format}
        formats={formats}
        onFormatChange={setFormat}
        age={activeAge}
        ages={ages}
        onAgeChange={setAge}
        showAgeFilter={showAgeFilter}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        showViewToggle={!isQuestDisplay}
        totalCount={boardItems.length}
        visibleCount={visibleItems.length}
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
        <ol className="relative space-y-8 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-[color:var(--schedule-timeline-line)] lg:before:left-[12rem]">
          {visibleGroups.map((group) => (
            <li
              key={group.key}
              className="group/timeline relative grid gap-4 pl-7 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-6 lg:pl-0"
            >
              <div className="lg:sticky lg:top-24 lg:self-start lg:pr-8 lg:text-right">
                <div className="absolute top-2 left-1 size-4 rounded-full border border-[color:var(--schedule-timeline-node)] bg-background shadow-[0_0_18px_color-mix(in_oklch,var(--schedule-timeline-node)_45%,transparent)] transition-transform before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-[color:var(--schedule-timeline-node)] before:opacity-30 group-hover/timeline:scale-125 lg:left-[11.5rem]" />
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
                  isQuestDisplay || viewMode === "compact" ? "gap-5" : "gap-8",
                )}
              >
                {group.items.map((item) => (
                  <ScheduleBoardCard
                    key={item.offer.id}
                    item={item}
                    mode={effectiveViewMode}
                    schoolSlug={schoolSlug}
                    bookingSchoolSlug={bookingSchoolSlug}
                    expanded={expandedCardId === item.offer.id}
                    highlighted={highlightedOfferId === item.offer.id}
                    onExpandChange={(expanded, anchor) =>
                      changeExpandedCard(item.offer.id, expanded, anchor)
                    }
                    onNavigate={() => rememberNavigation(item.offer.id)}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}

      {hideCommunityPanel ? null : (
      <CommunityConnectPanel
        variant="card"
        className="mt-10"
        {...communityConnectCopy.agendaNoShift}
      />
      )}
    </section>
  );
}
