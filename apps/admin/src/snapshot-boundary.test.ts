import { describe, expect, it } from "vitest";

import {
  parseSnapshotsBundle,
  SnapshotBundleValidationError,
} from "./snapshot-boundary";
import {
  createValidSnapshotBundleFixture,
  createValidSnapshotBundleWithObjectOptionalsFixture,
} from "./test-fixtures/snapshot-bundle.fixtures";

describe("current flat snapshot bundle boundary", () => {
  it("accepts the current flat envelope with object snapshot roots", () => {
    const bundle = createValidSnapshotBundleWithObjectOptionalsFixture();

    const parsed = parseSnapshotsBundle(bundle);
    expect(parsed).toBe(bundle);
  });

  it("accepts null for the current nullable snapshot roots", () => {
    const bundle = createValidSnapshotBundleFixture();

    const parsed = parseSnapshotsBundle(bundle);
    expect(parsed).toBe(bundle);
    expect(parsed.manifest).toBeNull();
    expect(parsed.offers).toBeNull();
  });
  it("accepts null-prototype objects at object boundaries", () => {
    const catalog = Object.assign(Object.create(null), {
      version: 2,
      generatedAt: "synthetic-generated-at",
      source: "synthetic-source",
      integrity: Object.assign(Object.create(null), {
        contentHash: "synthetic-content-hash",
      }),
      worlds: [],
      courses: [],
    }) as Record<string, unknown>;
    const map = Object.assign(Object.create(null), {
      version: 2,
      generatedAt: "synthetic-generated-at",
      source: "synthetic-source",
      integrity: Object.assign(Object.create(null), {
        contentHash: "synthetic-content-hash",
      }),
      venues: [],
    }) as Record<string, unknown>;
    const site = Object.assign(Object.create(null), {
      version: 2,
      generatedAt: "synthetic-generated-at",
      source: "synthetic-source",
      brand: Object.create(null),
      navigation: Object.create(null),
      cities: [],
    }) as Record<string, unknown>;
    const manifest = Object.assign(Object.create(null), {
      version: 2,
      generatedAt: "synthetic-generated-at",
      source: "synthetic-source",
      snapshots: Object.create(null),
    }) as Record<string, unknown>;
    const offers = Object.assign(Object.create(null), {
      version: 1,
      generatedAt: "synthetic-generated-at",
      source: "synthetic-source",
      offersByQuest: Object.create(null),
    }) as Record<string, unknown>;
    const bundle = Object.assign(Object.create(null), {
      ok: true,
      catalog,
      map,
      site,
      manifest,
      offers,
    });

    const parsed = parseSnapshotsBundle(bundle);
    expect(parsed).toBe(bundle);
  });

  it("rejects a non-object bundle root", () => {
    const cases: unknown[] = [null, [], "invalid"];

    for (const input of cases) {
      expect(() => parseSnapshotsBundle(input)).toThrow(
        SnapshotBundleValidationError,
      );
      try {
        parseSnapshotsBundle(input);
      } catch (error) {
        expect(error).toBeInstanceOf(SnapshotBundleValidationError);
        const issues = (error as SnapshotBundleValidationError).issues;
        expect(issues[0]).toEqual({
          path: "$",
          code: "INVALID_TYPE",
          expected: "object",
        });
      }
    }
  });

  it("rejects a missing success flag", () => {
    try {
      parseSnapshotsBundle({
        catalog: {},
        map: {},
        site: {},
        manifest: null,
        offers: null,
      });
      expect.unreachable("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      expect((error as SnapshotBundleValidationError).issues).toContainEqual({
        path: "$.ok",
        code: "REQUIRED",
        expected: "literal true",
      });
    }
  });

  it("rejects a non-true success flag", () => {
    const cases: unknown[] = [false, "true"];

    for (const ok of cases) {
      try {
        parseSnapshotsBundle({
          ok,
          catalog: {},
          map: {},
          site: {},
          manifest: null,
          offers: null,
        });
        expect.unreachable("expected validation failure");
      } catch (error) {
        expect(error).toBeInstanceOf(SnapshotBundleValidationError);
        expect((error as SnapshotBundleValidationError).issues).toContainEqual({
          path: "$.ok",
          code: "INVALID_VALUE",
          expected: "literal true",
        });
      }
    }
  });

  it("reports missing required snapshot roots in stable order", () => {
    try {
      parseSnapshotsBundle({ ok: true });
      expect.unreachable("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      const issues = (error as SnapshotBundleValidationError).issues;
      expect(issues).toHaveLength(5);
      expect(issues).toEqual([
        { path: "$.catalog", code: "REQUIRED", expected: "object" },
        { path: "$.map", code: "REQUIRED", expected: "object" },
        { path: "$.site", code: "REQUIRED", expected: "object" },
        { path: "$.manifest", code: "REQUIRED", expected: "object|null" },
        { path: "$.offers", code: "REQUIRED", expected: "object|null" },
      ]);
    }
  });

  it("rejects invalid catalog map and site root kinds", () => {
    try {
      parseSnapshotsBundle({
        ok: true,
        catalog: [],
        map: null,
        site: "invalid",
        manifest: null,
        offers: null,
      });
      expect.unreachable("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      expect((error as SnapshotBundleValidationError).issues).toEqual([
        { path: "$.catalog", code: "INVALID_TYPE", expected: "object" },
        { path: "$.map", code: "INVALID_TYPE", expected: "object" },
        { path: "$.site", code: "INVALID_TYPE", expected: "object" },
      ]);
    }
  });

  it("rejects invalid manifest and offers root kinds", () => {
    try {
      parseSnapshotsBundle({
        ok: true,
        catalog: {},
        map: {},
        site: {},
        manifest: [],
        offers: 1,
      });
      expect.unreachable("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      expect((error as SnapshotBundleValidationError).issues).toEqual([
        { path: "$.manifest", code: "INVALID_TYPE", expected: "object|null" },
        { path: "$.offers", code: "INVALID_TYPE", expected: "object|null" },
      ]);
    }
  });

  it("rejects class instances where plain objects are required", () => {
    class SyntheticDocument {
      synthetic = true;
    }

    try {
      parseSnapshotsBundle({
        ok: true,
        catalog: new Date(),
        map: new SyntheticDocument(),
        site: {},
        manifest: null,
        offers: null,
      });
      expect.unreachable("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      expect((error as SnapshotBundleValidationError).issues).toEqual([
        { path: "$.catalog", code: "INVALID_TYPE", expected: "object" },
        { path: "$.map", code: "INVALID_TYPE", expected: "object" },
      ]);
    }
  });

  it("preserves unknown additive top-level fields", () => {
    const bundle = createValidSnapshotBundleFixture();
    const fixtureMetadata = bundle.fixtureMetadata;

    const parsed = parseSnapshotsBundle(bundle);
    expect(parsed).toBe(bundle);
    expect(parsed.fixtureMetadata).toBe(fixtureMetadata);
  });

  it("keeps validation diagnostics bounded and free of raw values", () => {
    const marker = "SYNTHETIC_PRIVATE_SNAPSHOT_VALUE_M1_04";

    try {
      parseSnapshotsBundle({
        ok: false,
        catalog: marker,
        map: [marker],
        site: null,
        manifest: marker,
        offers: { leak: marker },
        extra: marker,
      });
      expect.unreachable("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      const validationError = error as SnapshotBundleValidationError;
      expect(validationError.issues.length).toBeLessThanOrEqual(5);
      expect(validationError.message).not.toContain(marker);
      expect(String(validationError)).not.toContain(marker);
      expect(JSON.stringify(validationError)).not.toContain(marker);
      expect(Object.prototype.hasOwnProperty.call(validationError, "cause")).toBe(
        false,
      );
      expect(validationError.cause).toBeUndefined();
      for (const issue of validationError.issues) {
        expect(Object.keys(issue).sort()).toEqual(["code", "expected", "path"]);
        expect(Object.prototype.hasOwnProperty.call(issue, "input")).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(issue, "value")).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(issue, "received")).toBe(
          false,
        );
        expect(Object.prototype.hasOwnProperty.call(issue, "payload")).toBe(
          false,
        );
        expect(Object.prototype.hasOwnProperty.call(issue, "details")).toBe(
          false,
        );
        expect(Object.prototype.hasOwnProperty.call(issue, "cause")).toBe(false);
      }
    }
  });

  it("distinguishes allowed null from a missing nullable property", () => {
    const withNull = createValidSnapshotBundleFixture();
    expect(parseSnapshotsBundle(withNull)).toBe(withNull);

    try {
      parseSnapshotsBundle({
        ok: true,
        catalog: {},
        map: {},
        site: {},
        offers: null,
      });
      expect.unreachable("expected missing manifest failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      expect((error as SnapshotBundleValidationError).issues).toContainEqual({
        path: "$.manifest",
        code: "REQUIRED",
        expected: "object|null",
      });
    }

    try {
      parseSnapshotsBundle({
        ok: true,
        catalog: {},
        map: {},
        site: {},
        manifest: null,
      });
      expect.unreachable("expected missing offers failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      expect((error as SnapshotBundleValidationError).issues).toContainEqual({
        path: "$.offers",
        code: "REQUIRED",
        expected: "object|null",
      });
    }
  });
});
