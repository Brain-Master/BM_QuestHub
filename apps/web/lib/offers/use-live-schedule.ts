"use client";

import { useMemo } from "react";
import useSWR from "swr";

import { mergeOffersIntoQuests } from "@/lib/offers/merge-offers";
import {
  fetchOffersSnapshotClient,
  isLiveScheduleClientEnabled,
  publicOffersSnapshotUrl,
} from "@/lib/offers/snapshot-client";
import { isUsableOffersSnapshot } from "@/lib/offers/snapshot-parse";
import type { Quest } from "@/lib/schemas";
import { mergeMosAvailability } from './mos-availability';
import { fetchMosAvailabilityClient, mosAvailabilityUrl } from './mos-availability-client';

export type LiveScheduleStatus = "idle" | "loading" | "ready" | "error";

const POLL_MS = 60_000;

export function useLiveSchedule(
  baseQuests: Quest[],
  options?: {
    refreshInterval?: number;
    enabled?: boolean;
    initialSnapshotGeneratedAt?: string | null;
  },
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
  const availability=useSWR(enabled?mosAvailabilityUrl(publicOffersSnapshotUrl()):null,fetchMosAvailabilityClient,{
    refreshInterval:enabled?refreshInterval:0,revalidateOnFocus:true,dedupingInterval:5_000,
    // SWR pauses interval revalidation while an error is cached; keep bounded-frequency recovery enabled.
    errorRetryInterval:60_000,shouldRetryOnError:true,
  });

  const quests = useMemo(() => {
    if (!enabled) return baseQuests;
    const baseline=data&&isUsableOffersSnapshot(data)?mergeOffersIntoQuests(baseQuests,data):baseQuests;
    const merged=mergeMosAvailability(baseline,availability.data);
    if(!availability.error)return merged;
    return merged.map(q=>({...q,offers:q.offers.map(o=>o.annual?{...o,annual:{...o.annual,
      availabilityError:o.annual.availabilityError??'MOS_FETCH_FAILED'}}:o)}));
  }, [baseQuests, data, enabled, availability.data, availability.error]);

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
    isValidating: isValidating || availability.isValidating,
    refresh: () => { void mutate(); void availability.mutate(); },
    liveEnabled: enabled,
    hasLiveSnapshot: Boolean(data && isUsableOffersSnapshot(data)),
    snapshotGeneratedAt: (() => {
      const liveAt =
        data && isUsableOffersSnapshot(data) ? data.generatedAt : null;
      return liveAt ?? options?.initialSnapshotGeneratedAt ?? null;
    })(),
  };
}
