"use client";

import { Suspense } from "react";

import { SubdomainScopeRedirect } from "@/components/subdomain-scope-redirect";

function SubdomainScopeRedirectInner() {
  return <SubdomainScopeRedirect />;
}

/** Wraps redirect logic that uses useSearchParams (needs Suspense in static export). */
export function HostScopeBootstrap() {
  return (
    <Suspense fallback={null}>
      <SubdomainScopeRedirectInner />
    </Suspense>
  );
}
