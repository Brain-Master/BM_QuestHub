import { isRetiredSchool } from './retired-schools.mjs';
/** Owner-confirmed removals, 2026-09-23 and 2026-09-25. Not inferred from admission or HTTP errors.
 * Listing numbers are MOS identities, not school-authored group codes.
 * Keep source/history; reactivation requires an explicit reviewed owner decision.
 */
export const retiredAnnualListings = Object.freeze([
  '2548561', '2549843', '2549844', '2549845', '2463216',
]);
const retired = new Set(retiredAnnualListings);

/** Owner-approved audit correction, 2026-09-24. Exact replacements, never slot matching.
 * Keep К4045 on listing 2548560 and both groups at 169Б.
 */
export const supersededAnnualGroups = Object.freeze({
  'К4046-26': 'К4061-26', 'К4048-26': 'К4062-26',
  'К4049-26': 'К4063-26', 'К4050-26': 'К4064-26',
  'К4051-26': 'К4065-26', 'К4052-26': 'К4066-26',
  'К4053-26': 'К4067-26', 'К4054-26': 'К4068-26',
});

/** Old public links keep working; unrelated/unknown IDs are not rewritten. */
export function canonicalAnnualOfferId(id) {
  const replacement = id.startsWith('year:') && Object.hasOwn(supersededAnnualGroups, id.slice(5)) && supersededAnnualGroups[id.slice(5)];
  return replacement ? `year:${replacement}` : id;
}

/** @param {unknown} group Raw MOS/source group or public offer. */
export function isRetiredAnnualGroup(group) {
  if (!group || typeof group !== 'object') return false;
  if (isRetiredSchool(group)) return true;
  const row = /** @type {Record<string, unknown>} */ (group);
  const annual = row.annual && typeof row.annual === 'object'
    ? /** @type {Record<string, unknown>} */ (row.annual) : undefined;
  const listing = annual?.listingId ?? row.listingId;
  const code = annual?.groupCode ?? row.groupCode;
  return typeof listing === 'string' && (retired.has(listing) ||
    (listing === '2548560' && typeof code === 'string' && Object.hasOwn(supersededAnnualGroups, code)));
}
