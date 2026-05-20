import assert from "node:assert/strict";
import test from "node:test";

import type { HostAliasesDocument } from "@/lib/host-scope";
import { resolveAnalyticsScope } from "@/lib/analytics-scope";

const aliases: HostAliasesDocument = {
  version: 1,
  baseDomain: "b-master.pro",
  portalOrigin: "https://quest.b-master.pro",
  reserved: ["quest"],
  schools: {
    "1517": {
      scopeSlug: "school-1517",
      routeSlug: "1517",
      name: "Школа №1517",
    },
  },
};

test("resolveAnalyticsScope: school subdomain", () => {
  const r = resolveAnalyticsScope({
    pathname: "/",
    hostSchool: { scopeSlug: "school-1517" },
    aliases,
  });
  assert.equal(r.scope, "school_subdomain");
  assert.equal(r.school_slug, "school-1517");
});

test("resolveAnalyticsScope: /sites route slug", () => {
  const r = resolveAnalyticsScope({
    pathname: "/sites/1517/agenda/",
    hostSchool: null,
    aliases,
  });
  assert.equal(r.scope, "school_site");
  assert.equal(r.school_slug, "school-1517");
});

test("resolveAnalyticsScope: ?school= scope slug", () => {
  const r = resolveAnalyticsScope({
    pathname: "/agenda/",
    searchSchool: "school-2103",
    hostSchool: null,
    aliases,
  });
  assert.equal(r.scope, "school_query");
  assert.equal(r.school_slug, "school-2103");
});

test("resolveAnalyticsScope: portal", () => {
  const r = resolveAnalyticsScope({
    pathname: "/agenda/",
    hostSchool: null,
    aliases,
  });
  assert.equal(r.scope, "portal");
  assert.equal(r.school_slug, "");
});
