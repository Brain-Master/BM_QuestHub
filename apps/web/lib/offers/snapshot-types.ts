import type { VenueOffer } from "@/lib/schemas";

export type OffersSnapshotSource =
  | "bootstrap"
  | "google_sheet"
  | "s3_schedule_snapshot"
  | "invalid_file"
  | "missing_or_unreadable"
  | (string & {});

/** Снимок офферов после успешной валидации (файл `data/offers-snapshot.json`). */
export type OffersSnapshotV1 = {
  version: 1;
  generatedAt: string;
  /** Откуда собран снимок: bootstrap / google_sheet / s3_schedule_snapshot и т.п. */
  source?: OffersSnapshotSource;
  /** Ключ — `quest.slug` */
  offersByQuest: Record<string, VenueOffer[]>;
};

export type OffersSnapshot = OffersSnapshotV1;
