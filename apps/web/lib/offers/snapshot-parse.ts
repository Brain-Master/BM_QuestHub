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
