/** Owner-confirmed removals, 2026-09-23. Not inferred from admission or HTTP errors.
 * Listing numbers are MOS identities, not school-authored group codes.
 * Keep source/history; reactivation requires an explicit reviewed owner decision.
 */
export const retiredAnnualListings = Object.freeze([
  '2548561', '2549843', '2549844', '2549845',
]);
const retired = new Set(retiredAnnualListings);

/** @param {unknown} group Raw MOS/source group or public offer. */
export function isRetiredAnnualGroup(group) {
  if (!group || typeof group !== 'object') return false;
  const row = /** @type {Record<string, unknown>} */ (group);
  const annual = row.annual && typeof row.annual === 'object'
    ? /** @type {Record<string, unknown>} */ (row.annual) : undefined;
  const listing = annual?.listingId ?? row.listingId;
  return typeof listing === 'string' && retired.has(listing);
}
