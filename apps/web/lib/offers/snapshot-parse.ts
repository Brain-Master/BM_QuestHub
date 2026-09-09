import { venueOfferSchema } from "@/lib/schemas";
import { z } from "zod";

import type { OffersSnapshotSource, OffersSnapshotV1 } from "./snapshot-types";

const snapshotSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  source: z.string().optional(),
  offersByQuest: z.record(z.string(), z.array(venueOfferSchema)),
});

export function emptyOffersSnapshot(
  source: OffersSnapshotSource = "missing_or_unreadable",
): OffersSnapshotV1 {
  return {
    version: 1,
    generatedAt: new Date(0).toISOString(),
    source,
    offersByQuest: {},
  };
}

export function parseOffersSnapshot(
  data: unknown,
  invalidSource: OffersSnapshotSource = "invalid_file",
): OffersSnapshotV1 {
  const parsed = snapshotSchema.safeParse(data);
  if (!parsed.success) {
    if (typeof window === "undefined") {
      console.error(
        "[offers-snapshot] invalid snapshot payload:",
        parsed.error.flatten(),
      );
    }
    return emptyOffersSnapshot(invalidSource);
  }
  return parsed.data;
}

export function countOffersInSnapshot(snapshot: OffersSnapshotV1): number {
  return Object.values(snapshot.offersByQuest).reduce(
    (sum, offers) => sum + offers.length,
    0,
  );
}

/** Reject Unix epoch and other placeholder timestamps used when S3 fetch fails. */
const MIN_DISPLAYABLE_SNAPSHOT_MS = Date.parse("2020-01-01T00:00:00.000Z");

export function isDisplayableSnapshotGeneratedAt(
  iso: string | null | undefined,
): boolean {
  if (!iso?.trim()) return false;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && ms >= MIN_DISPLAYABLE_SNAPSHOT_MS;
}

/** True when snapshot has real offers from S3/Sheet, not the empty fallback payload. */
export function isUsableOffersSnapshot(snapshot: OffersSnapshotV1): boolean {
  return (
    snapshot.source !== "missing_or_unreadable" &&
    snapshot.source !== "invalid_file" &&
    isDisplayableSnapshotGeneratedAt(snapshot.generatedAt)
  );
}
