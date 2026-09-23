/** Owner-confirmed public age ranges; raw portal ranges remain in the registry. */
const identities={'К2215-26':'2573579','К2216-26':'2573583','К2217-26':'2573587','К2218-26':'2573589'};
export function reviewedAnnualAge(groupCode, listingId) {
 return Object.hasOwn(identities,groupCode??'') && (listingId===undefined||identities[groupCode]===listingId)
  ? {ageMin:6,ageMax:13} : undefined;
}
