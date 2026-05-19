/**
 * Shared school subdomain alias logic (used by generate-host-aliases.mjs and node --test).
 * TypeScript mirror: apps/web/lib/host-scope.ts
 */

export const DEFAULT_BASE_DOMAIN = "b-master.pro";
export const DEFAULT_PORTAL_ORIGIN = "https://quest.b-master.pro";

export const RESERVED_SUBDOMAINS = [
  "quest",
  "www",
  "teacher",
  "n8n",
  "s",
  "moodle",
  "mail",
  "api",
  "dev",
  "staging",
  "admin",
];

/**
 * @param {string} scopeSlug
 * @returns {string[]}
 */
export function routeSlugsForSchoolScope(scopeSlug) {
  const aliases = [scopeSlug];
  const short = scopeSlug.match(/^school-(.+)$/)?.[1];
  if (short) aliases.push(short);
  return aliases;
}

/**
 * @param {Array<{ slug: string, name: string, displayName?: string, schoolScopeSlug?: string | null }>} venues
 * @returns {Map<string, { scopeSlug: string, routeSlug: string, name: string, hostLabel: string }>}
 */
export function buildSchoolScopesFromVenues(venues) {
  /** @type {Map<string, { scopeSlug: string, routeSlug: string, name: string, venues: unknown[] }>} */
  const byScope = new Map();

  for (const venue of venues) {
    if (!venue.schoolScopeSlug) continue;
    const scopeSlug = venue.schoolScopeSlug;
    const current = byScope.get(scopeSlug);
    if (current) {
      current.venues.push(venue);
      continue;
    }
    byScope.set(scopeSlug, {
      scopeSlug,
      name: venue.displayName ?? venue.name,
      routeSlugs: routeSlugsForSchoolScope(scopeSlug),
      venues: [venue],
    });
  }

  return byScope;
}

/**
 * @param {string} scopeSlug
 * @param {string[]} routeSlugs
 * @returns {string | undefined}
 */
export function pickHostLabel(scopeSlug, routeSlugs) {
  const numeric = routeSlugs.find((s) => /^\d+$/.test(s));
  if (numeric) return numeric;
  const short = scopeSlug.match(/^school-(.+)$/)?.[1];
  if (short) return short;
  return routeSlugs[0];
}

/**
 * @param {Array<{ slug: string, name: string, displayName?: string, schoolScopeSlug?: string | null }>} venues
 * @param {{ baseDomain?: string }} [opts]
 */
export function buildHostAliasesDocument(venues, opts = {}) {
  const baseDomain = opts.baseDomain ?? DEFAULT_BASE_DOMAIN;
  const scopes = buildSchoolScopesFromVenues(venues);
  /** @type {Record<string, { scopeSlug: string, routeSlug: string, name: string }>} */
  const schools = {};

  for (const scope of scopes.values()) {
    const hostLabel = pickHostLabel(scope.scopeSlug, scope.routeSlugs);
    if (!hostLabel || RESERVED_SUBDOMAINS.includes(hostLabel)) continue;
    const routeSlug =
      scope.routeSlugs.find((s) => s === hostLabel) ?? scope.routeSlugs[0];
    schools[hostLabel] = {
      scopeSlug: scope.scopeSlug,
      routeSlug,
      name: scope.name,
    };
  }

  return {
    version: 1,
    baseDomain,
    portalOrigin: DEFAULT_PORTAL_ORIGIN,
    reserved: [...RESERVED_SUBDOMAINS],
    schools,
  };
}

/**
 * @param {string} hostname
 * @param {{ baseDomain: string, reserved: string[], schools: Record<string, { routeSlug: string }> }} aliases
 */
export function parseSchoolHost(hostname, aliases) {
  const host = hostname.split(":")[0].toLowerCase();
  const base = aliases.baseDomain.toLowerCase();
  if (host === base || host === `www.${base}`) return null;
  if (!host.endsWith(`.${base}`)) return null;
  const label = host.slice(0, -(base.length + 1));
  if (!label || label.includes(".")) return null;
  if (aliases.reserved.includes(label)) return null;
  const school = aliases.schools[label];
  if (!school) return null;
  return { hostLabel: label, ...school };
}

/**
 * @param {string} hostname
 * @param {{ reserved: string[], baseDomain: string, schools: Record<string, unknown> }} aliases
 */
export function isUnknownSchoolHost(hostname, aliases) {
  const host = hostname.split(":")[0].toLowerCase();
  const base = aliases.baseDomain.toLowerCase();
  if (host === base || host === `www.${base}`) return false;
  if (!host.endsWith(`.${base}`)) return false;
  const label = host.slice(0, -(base.length + 1));
  if (!label || label.includes(".")) return false;
  if (aliases.reserved.includes(label)) return false;
  return !(label in aliases.schools);
}

/**
 * Normalize pathname (trailing slash except root handling).
 * @param {string} pathname
 */
export function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

const SHORT_ALIAS_PATHS = new Set(["/", "/agenda/", "/catalog/"]);

/**
 * @param {string} pathname
 * @param {{ routeSlug: string }} school
 * @returns {string | null}
 */
export function resolveSchoolSubdomainRedirect(pathname, school) {
  const path = normalizePathname(pathname);
  if (!SHORT_ALIAS_PATHS.has(path)) return null;
  if (path === "/") return `/sites/${school.routeSlug}/`;
  if (path === "/agenda/") return `/sites/${school.routeSlug}/agenda/`;
  if (path === "/catalog/") return `/sites/${school.routeSlug}/catalog/`;
  return null;
}

/**
 * @param {string} hostname
 * @param {{ portalOrigin?: string, baseDomain: string, reserved: string[], schools: Record<string, unknown> }} aliases
 * @param {string} pathname
 * @param {string} search
 */
export function resolveUnknownHostRedirect(hostname, aliases, pathname, search) {
  if (!isUnknownSchoolHost(hostname, aliases)) return null;
  const origin = aliases.portalOrigin ?? DEFAULT_PORTAL_ORIGIN;
  return `${origin}${pathname}${search}`;
}
