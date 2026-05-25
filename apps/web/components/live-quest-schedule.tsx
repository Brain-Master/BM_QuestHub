"use client";

import { useMemo } from "react";

import { ScheduleBoard } from "@/components/schedule-board";
import { buildAgendaItems, groupAgendaItems } from "@/lib/offers/agenda";
import { useLiveSchedule } from "@/lib/offers/use-live-schedule";
import { useScheduleTrafficPulse } from "@/lib/schedule/use-schedule-traffic-pulse";
import type { Quest, Venue, World } from "@/lib/schemas";

type Props = {
  baseQuests: Quest[];
  venues: Venue[];
  worlds: World[];
  questSlug: string;
};

export function LiveQuestSchedule({ baseQuests, venues, worlds, questSlug }: Props) {
  const { quests, status, liveEnabled, snapshotGeneratedAt } = useLiveSchedule(
    baseQuests,
    {
      refreshInterval: 60_000,
    },
  );

  useScheduleTrafficPulse({ page: "quest_schedule", enabled: liveEnabled });

  const groups = useMemo(() => {
    const quest = quests.find((q) => q.slug === questSlug);
    if (!quest) return [];
    return groupAgendaItems(
      buildAgendaItems({
        quests: [quest],
        venues,
        worlds,
      }),
    );
  }, [quests, venues, worlds, questSlug]);

  return (
    <>
      {liveEnabled && status === "loading" && groups.length === 0 ? (
        <div className="space-y-4" aria-hidden>
          <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </div>
      ) : null}
      <ScheduleBoard
        groups={groups}
        title="Площадки и запись"
        description="Если для смены ещё нет карточки mos.ru, кнопка открывает форму заявки в модальном окне."
        showProgramFilter={false}
        displayMode="quest"
        snapshotGeneratedAt={snapshotGeneratedAt}
      />
    </>
  );
}
