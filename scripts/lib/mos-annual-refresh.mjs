import { fetchMosCard, validateProjectedMosCard } from "./mos-annual-cards.mjs";
import { groupLifecycle, moscowDate } from "./mos-group-lifecycle.mjs";

/** Refresh only pre-verified card identities; preserve last known facts on failure. */
export async function refreshAnnualCards(registry, { fetchCard = fetchMosCard, now = () => new Date().toISOString(), concurrency = 2, sourceGroups = {} } = {}) {
  if (registry?.version !== 1 || !registry.groups || !Number.isInteger(registry.expectedGroups)) throw Error("ANNUAL_REGISTRY_INVALID");
  const groups = structuredClone(registry.groups), today = moscowDate(now());
  const allGroups = {...sourceGroups, ...registry.groups};
  const lifecycle = new Map(Object.entries(allGroups).map(([id, group])=>[id, groupLifecycle(group, today)]));
  const archivedIds = new Set([...lifecycle].filter(([,g])=>g.state==="archived").map(([id])=>id));
  const entries = Object.entries(registry.groups).filter(([id])=>["current","future"].includes(lifecycle.get(id).state));
  const errors = [];
  for (const [groupId, result] of lifecycle) if(result.state==="unknown") errors.push({groupId,phase:"lifecycle",code:result.reason});
  let verifiedGroups = 0;
  if (!Number.isFinite(concurrency) || concurrency < 1) throw Error("ANNUAL_CONCURRENCY_INVALID");
  const size = Math.max(1, Math.min(4, Math.floor(concurrency)));
  for (let offset = 0; offset < entries.length; offset += size) {
    await Promise.all(entries.slice(offset, offset + size).map(async ([id, previous]) => {
      const current = groupLifecycle(previous, moscowDate(now()));
      lifecycle.set(id,current);
      if (current.state === "archived") { archivedIds.add(id); return; }
      if (current.state === "unknown") { errors.push({groupId:id,phase:"lifecycle",code:current.reason}); return; }
      try {
        const next = await fetchCard(previous.cardId, { listingId: previous.listingId, groupCode: previous.groupCode });
        if (next.cardId !== previous.cardId || next.groupCode !== previous.groupCode || next.listingId !== previous.listingId) throw Error("MOS_IDENTITY_CHANGED");
        if (next.address !== previous.address || next.organization !== previous.organization) throw Error("MOS_LOCATION_REVIEW_REQUIRED");
        validateProjectedMosCard(next);
        // A partially missing source must not give retained older values a new
        // success timestamp. Keep the entire last-good card, flag the failed read.
        if (Object.entries(next).some(([key,value])=>value===null && previous[key]!==null && previous[key]!==undefined)) throw Error("MOS_PARTIAL_FIELDS");
        const merged = { ...previous, ...next, refreshedAt: now() };
        validateProjectedMosCard(merged);
        groups[id] = merged;
        verifiedGroups++;
      } catch (e) {
        const code = /^MOS_[A-Z0-9_]+$/.test(e.message ?? "") ? e.message : e.name === "TimeoutError" ? "MOS_TIMEOUT" : "MOS_FETCH_FAILED";
        errors.push({ groupId: id, phase: "card", code });
      }
    }));
  }
  for (const error of registry.errors ?? []) {
    if (!["identity","search"].includes(error.phase) || archivedIds.has(error.groupId)) continue;
    const listingIds = Object.entries(allGroups).filter(([,group])=>String(group.listingId)===String(error.listingId)).map(([id])=>id);
    if (error.phase === "search" && listingIds.length && listingIds.every(id=>archivedIds.has(id))) continue;
    errors.push(error);
  }
  const archivedGroups = archivedIds.size;
  return { ...registry, attemptedAt: now(), verifiedGroups, archivedGroups, groups, errors,
    ok: errors.length === 0 && verifiedGroups + archivedGroups === registry.expectedGroups };
}
