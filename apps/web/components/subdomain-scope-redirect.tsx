"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import {
  PREFERRED_SCHOOL_STORAGE_KEY,
} from "@/lib/preferred-school";
import {
  resolveSchoolSubdomainRedirect,
  resolveUnknownHostRedirect,
} from "@/lib/host-scope";
import { useHostScope } from "@/lib/use-host-scope";

/**
 * On school subdomains, maps /, /agenda/, /catalog/ → /sites/{routeSlug}/….
 * Unknown *.b-master.pro hosts redirect to quest.b-master.pro.
 */
export function SubdomainScopeRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { aliases, school, ready } = useHostScope();
  const search = searchParams.toString();
  const searchSuffix = search ? `?${search}` : "";

  React.useEffect(() => {
    if (!ready || !aliases || typeof window === "undefined") return;

    if (school) {
      const target = resolveSchoolSubdomainRedirect(pathname, school);
      if (target) {
        localStorage.setItem(
          PREFERRED_SCHOOL_STORAGE_KEY,
          JSON.stringify({ slug: school.scopeSlug, name: school.name }),
        );
        router.replace(`${target}${searchSuffix}`);
      }
      return;
    }

    const portalTarget = resolveUnknownHostRedirect(
      window.location.hostname,
      aliases,
      pathname,
      searchSuffix,
    );
    if (portalTarget) {
      window.location.replace(portalTarget);
    }
  }, [aliases, pathname, ready, router, school, searchSuffix]);

  return null;
}
