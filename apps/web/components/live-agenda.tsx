"use client";

import { useMemo } from "react";

import { OfferAgenda } from "@/components/offer-agenda";
import { buildAgendaItems, groupAgendaItems } from "@/lib/offers/agenda";
import { useLiveSchedule } from "@/lib/offers/use-live-schedule";
import type { Quest, Venue, World } from "@/lib/schemas";

type Props = {
  baseQuests: Quest[];
  venues: Venue[];
  worlds: World[];
  schoolSlug?: string;
  schoolName?: string;
  allAgendaHref?: string;
  sitesHref?: string;
};

export function LiveAgenda({
  baseQuests,
  venues,
  worlds,
  schoolSlug,
  schoolName,
  allAgendaHref,
  sitesHref,
}: Props) {
  const { quests, status, isValidating, liveEnabled } = useLiveSchedule(baseQuests, {
    refreshInterval: 60_000,
  });

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
                : "Расписание обновляется автоматически каждую минуту."}
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
        />
      )}
    </div>
  );
}
