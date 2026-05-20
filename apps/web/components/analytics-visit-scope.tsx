"use client";

import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";

import { resolveAnalyticsScope } from "@/lib/analytics-scope";
import { setVisitParams } from "@/lib/client-analytics";
import { useHostScope } from "@/lib/use-host-scope";

function AnalyticsVisitScopeInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchSchool = searchParams.get("school") ?? undefined;
  const { aliases, school, ready } = useHostScope();

  React.useEffect(() => {
    if (!ready) return;
    const resolved = resolveAnalyticsScope({
      pathname,
      searchSchool,
      hostSchool: school,
      aliases,
    });
    setVisitParams(resolved);
  }, [aliases, pathname, ready, school, searchSchool]);

  return null;
}

/** Sets Yandex Metrika visit params (scope, school_slug) from URL, ?school=, or subdomain. */
export function AnalyticsVisitScope() {
  return (
    <Suspense fallback={null}>
      <AnalyticsVisitScopeInner />
    </Suspense>
  );
}
