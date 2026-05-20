import type { HostAliasesDocument, ParsedSchoolHost } from "@/lib/host-scope";

export type AnalyticsScope =
  | "portal"
  | "school_site"
  | "school_subdomain"
  | "school_query";

export type ResolvedAnalyticsScope = {
  scope: AnalyticsScope;
  school_slug: string;
};

export function scopeSlugFromRouteSlug(
  routeSlug: string,
  aliases: HostAliasesDocument | null,
): string | null {
  const trimmed = routeSlug.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("school-")) return trimmed;

  if (aliases) {
    for (const entry of Object.values(aliases.schools)) {
      if (entry.routeSlug === trimmed || entry.scopeSlug === trimmed) {
        return entry.scopeSlug;
      }
    }
  }

  if (/^\d+$/.test(trimmed)) return `school-${trimmed}`;
  return null;
}

export function normalizeSchoolSlugParam(
  raw: string,
  aliases: HostAliasesDocument | null,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("school-")) return trimmed;
  return scopeSlugFromRouteSlug(trimmed, aliases);
}

export function resolveAnalyticsScope(input: {
  pathname: string;
  searchSchool?: string;
  hostSchool: Pick<ParsedSchoolHost, "scopeSlug"> | null;
  aliases: HostAliasesDocument | null;
}): ResolvedAnalyticsScope {
  if (input.hostSchool) {
    return {
      scope: "school_subdomain",
      school_slug: input.hostSchool.scopeSlug,
    };
  }

  const fromQuery = input.searchSchool
    ? normalizeSchoolSlugParam(input.searchSchool, input.aliases)
    : null;
  if (fromQuery) {
    return { scope: "school_query", school_slug: fromQuery };
  }

  const siteMatch = input.pathname.match(/^\/sites\/([^/]+)/);
  if (siteMatch) {
    const scopeSlug = scopeSlugFromRouteSlug(siteMatch[1], input.aliases);
    if (scopeSlug) {
      return { scope: "school_site", school_slug: scopeSlug };
    }
  }

  return { scope: "portal", school_slug: "" };
}
