import type { VenueOffer } from "@/lib/schemas";

/** Снимок офферов после успешной валидации (файл `data/offers-snapshot.json`). */
export type OffersSnapshotV1 = {
  version: 1;
  generatedAt: string;
  /** Откуда собран снимок: bootstrap / google_sheet и т.п. */
  source?: string;
  /** Ключ — `quest.slug` */
  offersByQuest: Record<string, VenueOffer[]>;
};
