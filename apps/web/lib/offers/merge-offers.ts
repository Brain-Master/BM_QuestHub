import type { Quest } from "@/lib/schemas";

import type { OffersSnapshotV1 } from "./snapshot-types";

export function mergeOffersIntoQuests(
  quests: Quest[],
  snapshot: OffersSnapshotV1,
): Quest[] {
  return quests.map((q) => {
    const incoming=snapshot.offersByQuest[q.slug] ?? [];
    const localAnnual=q.offers.filter(o=>o.annual);
    const remoteAnnual=incoming.filter(o=>o.annual);
    // An annual revision is a coherent curriculum/address set, not just seat counts.
    // A delayed previous release must not erase newly integrated groups or owner facts.
    const compatible=!localAnnual.length || (remoteAnnual.length===localAnnual.length &&
      localAnnual.every(o=>remoteAnnual.some(r=>r.id===o.id && r.annual?.sourceSha256===o.annual?.sourceSha256 && r.annual?.asOf===o.annual?.asOf)));
    if(!compatible)return {...q,offers:[...incoming.filter(o=>!o.annual),...localAnnual]};
    return {...q,offers:incoming.map(o=>{
      const previous=localAnnual.find(p=>p.id===o.id);
      return previous && (previous.annual?.refreshedAt??'')>(o.annual?.refreshedAt??'') ? previous : o;
    })};
  });
}

/** Static shell: course bodies without schedule rows (filled client-side). */
export function questsWithoutOffers(quests: Quest[]): Quest[] {
  return quests.map((q) => ({ ...q, offers: [] }));
}
