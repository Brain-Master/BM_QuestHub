import { publicS3BaseUrl } from "@/lib/data/public-snapshot-url";
import {
  countOffersInSnapshot,
  emptyOffersSnapshot,
  parseOffersSnapshot,
} from "@/lib/offers/snapshot-parse";
import type { OffersSnapshotV1 } from "@/lib/offers/snapshot-types";

const OFFERS_PATH = "data/offers-snapshot.json";

export function isLiveScheduleClientEnabled(): boolean {
  return publicS3BaseUrl() !== null;
}

export function publicOffersSnapshotUrl(): string | null {
  const base = publicS3BaseUrl();
  if (!base) return null;
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return new URL(OFFERS_PATH, normalized).toString();
}

export async function fetchOffersSnapshotClient(): Promise<OffersSnapshotV1> {
  const url = publicOffersSnapshotUrl();
  if (!url) {
    return emptyOffersSnapshot("missing_or_unreadable");
  }

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as unknown;
    const snapshot = parseOffersSnapshot(data, "invalid_file");
    if (countOffersInSnapshot(snapshot) === 0) {
      return emptyOffersSnapshot("missing_or_unreadable");
    }
    return snapshot;
  } catch {
    return emptyOffersSnapshot("missing_or_unreadable");
  }
}
