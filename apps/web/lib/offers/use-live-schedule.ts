"use client";

import { useMemo } from "react";
import useSWR from "swr";

import { mergeOffersIntoQuests } from "@/lib/offers/merge-offers";
import {
  fetchOffersSnapshotClient,
  isLiveScheduleClientEnabled,
  publicOffersSnapshotUrl,
} from "@/lib/offers/snapshot-client";
import type { Quest } from "@/lib/schemas";

export type LiveScheduleStatus = "idle" | "loading" | "ready" | "error";

const POLL_MS = 60_000;

export function useLiveSchedule(
  baseQuests: Quest[],
  options?: { refreshInterval?: number; enabled?: boolean },
) {
  const enabled =
    options?.enabled !== false && isLiveScheduleClientEnabled();
  const refreshInterval = options?.refreshInterval ?? POLL_MS;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? publicOffersSnapshotUrl() : null,
    fetchOffersSnapshotClient,
    {
      refreshInterval: enabled ? refreshInterval : 0,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    },
  );

  const quests = useMemo(() => {
    if (!enabled) return baseQuests;
    if (!data) return baseQuests;
    return mergeOffersIntoQuests(baseQuests, data);
  }, [baseQuests, data, enabled]);

  const status: LiveScheduleStatus = !enabled
    ? "idle"
    : isLoading && !data
      ? "loading"
      : error
        ? "error"
        : "ready";

  return {
    quests,
    status,
    error: error instanceof Error ? error : null,
    isValidating,
    refresh: () => void mutate(),
    liveEnabled: enabled,
  };
}
