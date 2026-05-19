/**
 * School subdomain aliases ({hostLabel}.b-master.pro → /sites/{routeSlug}/…).
 * Build output: public/host-aliases.json (see scripts/generate-host-aliases.mjs).
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
] as const;

export type SchoolHostEntry = {
  scopeSlug: string;
  routeSlug: string;
  name: string;
};

export type HostAliasesDocument = {
  version: number;
  baseDomain: string;
  portalOrigin: string;
  reserved: string[];
  schools: Record<string, SchoolHostEntry>;
};

export type ParsedSchoolHost = SchoolHostEntry & { hostLabel: string };

export function parseSchoolHost(
  hostname: string,
  aliases: HostAliasesDocument,
): ParsedSchoolHost | null {
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

export function isUnknownSchoolHost(
  hostname: string,
  aliases: HostAliasesDocument,
): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  const base = aliases.baseDomain.toLowerCase();
  if (host === base || host === `www.${base}`) return false;
  if (!host.endsWith(`.${base}`)) return false;
  const label = host.slice(0, -(base.length + 1));
  if (!label || label.includes(".")) return false;
  if (aliases.reserved.includes(label)) return false;
  return !(label in aliases.schools);
}

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

const SHORT_ALIAS_PATHS = new Set(["/", "/agenda/", "/catalog/"]);

export function resolveSchoolSubdomainRedirect(
  pathname: string,
  school: Pick<SchoolHostEntry, "routeSlug">,
): string | null {
  const path = normalizePathname(pathname);
  if (!SHORT_ALIAS_PATHS.has(path)) return null;
  if (path === "/") return `/sites/${school.routeSlug}/`;
  if (path === "/agenda/") return `/sites/${school.routeSlug}/agenda/`;
  if (path === "/catalog/") return `/sites/${school.routeSlug}/catalog/`;
  return null;
}

export function resolveUnknownHostRedirect(
  hostname: string,
  aliases: HostAliasesDocument,
  pathname: string,
  search: string,
): string | null {
  if (!isUnknownSchoolHost(hostname, aliases)) return null;
  const origin = aliases.portalOrigin ?? DEFAULT_PORTAL_ORIGIN;
  return `${origin}${pathname}${search}`;
}

/** True when the browser is on a school subdomain (known or unknown *.b-master.pro). */
export function isSchoolSubdomainHost(
  hostname: string,
  aliases: HostAliasesDocument,
): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  const base = aliases.baseDomain.toLowerCase();
  if (!host.endsWith(`.${base}`)) return false;
  const label = host.slice(0, -(base.length + 1));
  if (!label || label.includes(".")) return false;
  if (host === `www.${base}`) return false;
  return true;
}

export function isOnSchoolSubdomain(
  hostname: string,
  aliases: HostAliasesDocument,
): boolean {
  return parseSchoolHost(hostname, aliases) !== null;
}
