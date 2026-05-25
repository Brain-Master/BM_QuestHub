"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { OfferAgenda } from "@/components/offer-agenda";
import { buildAgendaItems, groupAgendaItems } from "@/lib/offers/agenda";
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
  schoolName?: string;
  allAgendaHref?: string;
  sitesHref?: string;
  hideScheduleTitle?: boolean;
  hideCommunityPanel?: boolean;
};

function LiveAgendaInner({
  baseQuests,
  venues,
  worlds,
  initialSnapshotGeneratedAt = null,
  schoolSlug,
  schoolName,
  allAgendaHref,
  sitesHref,
  hideScheduleTitle = false,
  hideCommunityPanel = false,
}: Props) {
  const searchParams = useSearchParams();
  const showSnapshotTime = isSnapshotStampVisible(searchParams);

  const { quests, status, isValidating, liveEnabled, snapshotGeneratedAt } =
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
          schoolSlug,
        }),
      ),
    [quests, venues, worlds, schoolSlug],
  );

  const showSkeleton = liveEnabled && status === "loading" && groups.length === 0;

  return (
    <div className="space-y-4">
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
          groups={groups}
          schoolSlug={schoolSlug}
          schoolName={schoolName}
          allAgendaHref={allAgendaHref}
          sitesHref={sitesHref}
          snapshotGeneratedAt={snapshotGeneratedAt}
          showSnapshotTime={showSnapshotTime}
          hideTitle={hideScheduleTitle}
          hideCommunityPanel={hideCommunityPanel}
        />
      )}
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
