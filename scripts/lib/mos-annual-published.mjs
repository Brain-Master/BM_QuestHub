/** Restore only newer, validated, same-identity facts before a Sheets/CSV rebuild. */
import {reviewedAnnualAge} from '../../apps/web/content/annual-owner-ages.mjs';
export function restorePublishedAnnual(registry, offers, {asOf, venueByGroup, studyYearByGroup = {}, preserveUnknown = false}) {
  if (!asOf || !venueByGroup) throw Error("ANNUAL_REVIEWED_MAPPING_REQUIRED");
  const next = structuredClone(registry), seen = new Set();
  for (const offer of offers) {
    if (seen.has(offer.id)) throw Error("ANNUAL_PUBLISHED_DUPLICATE");
    seen.add(offer.id);
    const id = offer.id?.replace(/^year:/, ""), previous = next.groups[id], a = offer.annual;
    if (!a) continue;
    // Check every source revision BEFORE freshness/identity selection. Sheets can
    // otherwise erase a newer source revision and hide it from the compiler guard.
    if (a.sourceSha256 !== registry.sourceSha256 || a.asOf !== asOf) throw Error("ANNUAL_PUBLISHED_REVISION_MISMATCH");
    if (!Object.hasOwn(venueByGroup,id)) {
      if (preserveUnknown) continue; // Compiler retains these raw records unchanged.
      throw Error("ANNUAL_PUBLISHED_UNKNOWN_GROUP");
    }
    if (offer.venueSlug !== venueByGroup[id]) throw Error("ANNUAL_PUBLISHED_VENUE_MISMATCH");
    if (!previous && a.refreshedAt) throw Error("ANNUAL_PUBLISHED_REGISTRY_ENTRY_MISSING");
    if (!previous || !a.refreshedAt || a.refreshedAt <= previous.refreshedAt) continue;
    if ((a.studyYear ?? null) !== (studyYearByGroup[id] ?? null)) throw Error("ANNUAL_PUBLISHED_YEAR_REVIEW_REQUIRED");
    if (a.sourceSha256 !== registry.sourceSha256 || a.listingId !== previous.listingId ||
        a.groupCode !== previous.groupCode || offer.mosBookingUrl !== previous.link) throw Error("ANNUAL_PUBLISHED_IDENTITY_MISMATCH");
    if (!offer.weeklySlots?.length) throw Error("ANNUAL_PUBLISHED_SLOTS_MISSING");
    // The public teacher is editorially reconciled, not the API's persons field.
    // Identity, location, source title and original API teacher stay in the registry.
    for (const key of ["ageMin", "ageMax", "totalSeats", "freeSeats", "lessonPrice", "coursePrice"]) {
      if ((key==='ageMin'||key==='ageMax') && reviewedAnnualAge(previous.groupCode, previous.listingId)) continue;
      // Editorial prices are not portal facts. Preserve an explicit raw unknown too.
      if (key === 'lessonPrice' && a.lessonPriceSource) {
        if (!Object.hasOwn(a,'sourceLessonPrice')) throw Error('ANNUAL_SOURCE_PRICE_MISSING');
        previous[key] = a.sourceLessonPrice;
      } else previous[key] = a[key];
    }
    Object.assign(previous, { courseStart: offer.startDate, courseEnd: offer.endDate,
      slots: structuredClone(offer.weeklySlots), status: a.admission, refreshedAt: a.refreshedAt });
  }
  return next;
}
