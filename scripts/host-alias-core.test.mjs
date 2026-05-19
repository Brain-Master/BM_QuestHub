import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildHostAliasesDocument,
  parseSchoolHost,
  resolveSchoolSubdomainRedirect,
  resolveUnknownHostRedirect,
  isUnknownSchoolHost,
} from "./host-alias-core.mjs";

const sampleAliases = buildHostAliasesDocument([
  {
    slug: "school-1517-narodnoe-opolchenie",
    name: "Школа №1517",
    schoolScopeSlug: "school-1517",
  },
  {
    slug: "school-17-belyaevo",
    name: "Школа №17",
    schoolScopeSlug: "school-17",
  },
]);

describe("parseSchoolHost", () => {
  it("resolves numeric school subdomain", () => {
    const parsed = parseSchoolHost("1517.b-master.pro", sampleAliases);
    assert.equal(parsed?.routeSlug, "1517");
    assert.equal(parsed?.scopeSlug, "school-1517");
  });

  it("returns null for portal host", () => {
    assert.equal(parseSchoolHost("quest.b-master.pro", sampleAliases), null);
  });

  it("returns null for reserved host", () => {
    assert.equal(parseSchoolHost("teacher.b-master.pro", sampleAliases), null);
  });
});

describe("resolveSchoolSubdomainRedirect", () => {
  it("maps short paths to scoped routes", () => {
    const school = sampleAliases.schools["1517"];
    assert.equal(resolveSchoolSubdomainRedirect("/", school), "/sites/1517/");
    assert.equal(
      resolveSchoolSubdomainRedirect("/agenda", school),
      "/sites/1517/agenda/",
    );
    assert.equal(
      resolveSchoolSubdomainRedirect("/catalog/", school),
      "/sites/1517/catalog/",
    );
  });

  it("ignores non-alias paths", () => {
    const school = sampleAliases.schools["1517"];
    assert.equal(resolveSchoolSubdomainRedirect("/worlds/mekhvarium", school), null);
  });
});

describe("unknown host", () => {
  it("detects unknown subdomain", () => {
    assert.equal(isUnknownSchoolHost("9999.b-master.pro", sampleAliases), true);
    assert.equal(isUnknownSchoolHost("1517.b-master.pro", sampleAliases), false);
  });

  it("builds portal redirect with path", () => {
    const target = resolveUnknownHostRedirect(
      "9999.b-master.pro",
      sampleAliases,
      "/agenda/",
      "?foo=1",
    );
    assert.equal(target, "https://quest.b-master.pro/agenda/?foo=1");
  });
});
