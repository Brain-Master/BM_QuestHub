/** Owner-confirmed end of partnership, 2026-09-25. Historical source is retained. */
export const retiredSchoolScopes = Object.freeze(['school-875']);

/** Exact school boundary: does not match e.g. school-8750. */
export function isRetiredSchool(value) {
  const slugs = typeof value === 'string' ? [value] : value && typeof value === 'object'
    ? [value.schoolScopeSlug, value.venueSlug, value.slug] : [];
  return slugs.some(slug => typeof slug === 'string' && retiredSchoolScopes.some(scope =>
    slug === scope || slug === scope.slice('school-'.length) || slug.startsWith(scope + '-')));
}
