"use client";

import { useMemo } from "react";

import { SiteSelectionGrid } from "@/components/site-selection-grid";
import { getSchoolScopes } from "@/lib/offers/agenda";
import { useLiveSchedule } from "@/lib/offers/use-live-schedule";
import { buildCityCards } from "@/lib/sites/city-card";
import { buildSiteScopeCards } from "@/lib/sites/scope-card";
import type { Quest, Venue, World } from "@/lib/schemas";

type Props = {
  baseQuests: Quest[];
  venues: Venue[];
  worlds: World[];
};

export function LiveSites({ baseQuests, venues, worlds }: Props) {
  const { quests, status, liveEnabled } = useLiveSchedule(baseQuests);

  const sites = useMemo(
    () =>
      buildSiteScopeCards({
        scopes: getSchoolScopes(venues),
        quests,
        venues,
        worlds,
        scheduleLoading: liveEnabled && status === "loading",
      }),
    [quests, venues, worlds, liveEnabled, status],
  );

  const cityCards = useMemo(() => buildCityCards(sites), [sites]);

  return (
    <>
      {liveEnabled && status === "loading" ? (
        <p className="mb-4 text-muted-foreground text-sm" role="status">
          Загружаем актуальное расписание по площадкам…
        </p>
      ) : null}
      <SiteSelectionGrid sites={sites} cityCards={cityCards} />
    </>
  );
}
