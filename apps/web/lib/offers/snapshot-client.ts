import { publicS3BaseUrl } from "@/lib/data/public-snapshot-url";
import {
  isUsableOffersSnapshot,
  emptyOffersSnapshot,
  parseOffersSnapshot,
} from "@/lib/offers/snapshot-parse";
import type { OffersSnapshotV1 } from "@/lib/offers/snapshot-types";

const OFFERS_PATH = "data/offers-snapshot.json";

export function isLiveScheduleClientEnabled(): boolean {
  return publicOffersSnapshotUrl() !== null;
}

export function publicOffersSnapshotUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_OFFERS_SNAPSHOT_URL?.trim();
  if (explicit) {
    if (explicit.startsWith("/") && !explicit.startsWith("//")) return explicit;
    const url = new URL(explicit);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Invalid public schedule URL");
    return url.toString();
  }
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
    if (!isUsableOffersSnapshot(snapshot)) throw new Error("Invalid schedule snapshot");
    return snapshot;
  } catch {
    throw new Error("Не удалось обновить расписание. Показаны последние загруженные данные.");
  }
}
