import type { Quest } from "@/lib/schemas";

import type { OffersSnapshotV1 } from "./snapshot-types";

export function mergeOffersIntoQuests(
  quests: Quest[],
  snapshot: OffersSnapshotV1,
): Quest[] {
  return quests.map((q) => ({
    ...q,
    offers: snapshot.offersByQuest[q.slug] ?? [],
  }));
}

/** Static shell: course bodies without schedule rows (filled client-side). */
export function questsWithoutOffers(quests: Quest[]): Quest[] {
  return quests.map((q) => ({ ...q, offers: [] }));
}
