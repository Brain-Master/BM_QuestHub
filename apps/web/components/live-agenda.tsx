"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { OfferAgenda } from "@/components/offer-agenda";
import { CourseFinder } from "@/components/course-finder";
import { buildAgendaItems, groupAgendaItems, resolveSchoolScope } from "@/lib/offers/agenda";
import { isSnapshotStampVisible } from "@/lib/offers/snapshot-stamp";
import { useLiveSchedule } from "@/lib/offers/use-live-schedule";
import { useScheduleTrafficPulse } from "@/lib/schedule/use-schedule-traffic-pulse";
import type { Quest, Venue, World } from "@/lib/schemas";

type Props = {
  baseQuests: Quest[];
  venues: Venue[];
  worlds: World[];
  initialSnapshotGeneratedAt?: string | null;
  schoolSlug?: string;
  venueSlug?: string;
  schoolName?: string;
  allAgendaHref?: string;
  sitesHref?: string;
  hideScheduleTitle?: boolean;
  hideCommunityPanel?: boolean;
  embedded?: boolean;
};

function LiveAgendaInner({
  baseQuests,
  venues,
  worlds,
  initialSnapshotGeneratedAt = null,
  schoolSlug,
  venueSlug,
  schoolName,
  allAgendaHref,
  sitesHref,
  hideCommunityPanel = false,
  embedded = false,
}: Props) {
  const searchParams = useSearchParams();
  const showSnapshotTime = isSnapshotStampVisible(searchParams);
  const querySchool = searchParams.get("school");
  const resolvedQuerySchool = querySchool ? resolveSchoolScope(venues, querySchool) : undefined;
  const effectiveSchoolSlug = schoolSlug ?? resolvedQuerySchool?.slug;
  const invalidSchoolQuery = !schoolSlug && !!querySchool && querySchool !== "all" && !resolvedQuerySchool;

  const { quests, status, isValidating, liveEnabled, snapshotGeneratedAt, refresh } =
    useLiveSchedule(baseQuests, {
      refreshInterval: 60_000,
      initialSnapshotGeneratedAt,
    });

  useScheduleTrafficPulse({ page: "agenda", enabled: liveEnabled });

  const groups = useMemo(
    () =>
      groupAgendaItems(
        buildAgendaItems({
          quests,
          venues,
          worlds,
          schoolSlug: effectiveSchoolSlug,
        }).filter(item=>venueSlug ? item.offer.venueSlug===venueSlug : !schoolSlug || item.quest.format!=="year" || (item.venue.schoolScopeSlug??item.venue.slug)===schoolSlug),
      ),
    [quests, venues, worlds, schoolSlug, effectiveSchoolSlug, venueSlug],
  );

  const showSkeleton = liveEnabled && status === "loading" && groups.length === 0;
  const annualItems = useMemo(() => buildAgendaItems({ quests, venues, worlds })
    .filter(item => item.quest.format === "year"), [quests, venues, worlds]);
  const intensiveGroups = useMemo(() => invalidSchoolQuery ? [] : groups.map(group => ({ ...group, items: group.items.filter(item => item.quest.format !== "year") })).filter(group => group.items.length), [groups, invalidSchoolQuery]);
  const selectedIntensive = !invalidSchoolQuery && intensiveGroups.some(group => group.items.some(item => item.offer.id === searchParams.get("offer")));

  // The same day/group cards as the agenda, with an H2 and catalogue entry on profiles.
  if (embedded) return <div className="space-y-4">
    <Link className="inline-flex min-h-11 items-center text-primary underline" href={`/sites/${schoolSlug}/agenda/`}>Подобрать кружок пошагово →</Link>
    <CourseFinder embedded items={annualItems} quests={quests} venues={venues} schoolSlug={schoolSlug} venueSlug={venueSlug}
      status={status} isValidating={isValidating} snapshotGeneratedAt={snapshotGeneratedAt} onRefresh={refresh} />
    <details><summary className="min-h-11 cursor-pointer py-3">Квесты и смены · расписание и архив</summary><OfferAgenda groups={intensiveGroups} schoolSlug={effectiveSchoolSlug} schoolName={schoolName} allAgendaHref={allAgendaHref} sitesHref={sitesHref}
      snapshotGeneratedAt={snapshotGeneratedAt} showSnapshotTime={showSnapshotTime} hideTitle hideCommunityPanel={hideCommunityPanel} />
    </details>
  </div>;

  return (
    <div className="space-y-4">
      {selectedIntensive ? <header className="space-y-3"><h1 className="font-heading text-3xl font-semibold">Квесты и смены</h1><Link className="inline-flex min-h-11 items-center text-primary underline" href={schoolSlug ? `/sites/${schoolSlug}/agenda/` : "/agenda/"}>Подобрать годовой кружок</Link></header> : <CourseFinder items={annualItems} quests={quests} venues={venues} schoolSlug={schoolSlug} venueSlug={venueSlug}
        status={status} isValidating={isValidating} snapshotGeneratedAt={snapshotGeneratedAt} onRefresh={refresh} />}
      <details className="rounded-2xl border border-white/15 p-4" data-testid="legacy-intensive-schedule" open={selectedIntensive || undefined}>
        <summary className="min-h-11 cursor-pointer py-3 font-semibold focus-visible:outline-2">Квесты и смены · расписание и архив</summary>
      {liveEnabled ? (
        <p className="text-muted-foreground text-sm" role="status">
          {status === "loading"
            ? "Загружаем расписание…"
            : status === "error"
              ? "Расписание временно недоступно — попробуйте обновить страницу."
              : isValidating
                ? "Обновляем расписание…"
                : "Снимок на сайте обновляется каждую минуту; места на mos.ru могут отличаться."}
        </p>
      ) : null}
      {showSkeleton ? (
        <div className="space-y-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : (
        <OfferAgenda
          groups={intensiveGroups}
          schoolSlug={effectiveSchoolSlug}
          schoolName={schoolName ?? resolvedQuerySchool?.name}
          allAgendaHref={allAgendaHref}
          sitesHref={sitesHref}
          snapshotGeneratedAt={snapshotGeneratedAt}
          showSnapshotTime={showSnapshotTime}
          hideTitle
          hideCommunityPanel={hideCommunityPanel}
        />
      )}
      </details>
    </div>
  );
}

export function LiveAgenda(props: Props) {
  return (
    <Suspense fallback={null}>
      <LiveAgendaInner {...props} />
    </Suspense>
  );
}
