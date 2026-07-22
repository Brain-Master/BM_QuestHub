import { describe, expect, it } from "vitest";

import {
  CURRENT_SNAPSHOT_VERSIONS,
  parseSnapshotsBundle,
  SnapshotBundleValidationError,
  type SnapshotsBundle,
} from "./snapshot-boundary";
import {
  createValidSnapshotBundleFixture,
  createValidSnapshotBundleWithObjectOptionalsFixture,
} from "./test-fixtures/snapshot-bundle.fixtures";

const CATALOG_FIELDS = [
  "version",
  "generatedAt",
  "source",
  "integrity",
  "worlds",
  "courses",
] as const;

const MAP_FIELDS = [
  "version",
  "generatedAt",
  "source",
  "integrity",
  "venues",
] as const;

const SITE_FIELDS = [
  "version",
  "generatedAt",
  "source",
  "brand",
  "navigation",
  "cities",
] as const;

const MANIFEST_FIELDS = [
  "version",
  "generatedAt",
  "source",
  "snapshots",
] as const;

const OFFERS_FIELDS = [
  "version",
  "generatedAt",
  "source",
  "offersByQuest",
] as const;

const INCOMPATIBLE_V2_VALUES: unknown[] = [1, 3, "2", 2.5, null, true, 0, -1];
const INCOMPATIBLE_V1_VALUES: unknown[] = [0, 2, "1", 1.5, null, true, -1, 3];

function cloneBundle(bundle: SnapshotsBundle): SnapshotsBundle {
  return structuredClone(bundle);
}

function expectRequiredField(
  root: "catalog" | "map" | "site" | "manifest" | "offers",
  field: string,
  expected:
    | "literal 1"
    | "literal 2"
    | "string"
    | "array"
    | "object",
): void {
  const bundle = cloneBundle(createValidSnapshotBundleWithObjectOptionalsFixture());
  const document = bundle[root] as Record<string, unknown>;
  delete document[field];

  try {
    parseSnapshotsBundle(bundle);
    expect.unreachable(`expected missing ${root}.${field}`);
  } catch (error) {
    expect(error).toBeInstanceOf(SnapshotBundleValidationError);
    expect((error as SnapshotBundleValidationError).issues).toContainEqual({
      path: `$.${root}.${field}`,
      code: "REQUIRED",
      expected,
    });
  }
}

function expectIncompatibleVersions(
  root: "catalog" | "map" | "site" | "manifest" | "offers",
  expectedLiteral: "literal 1" | "literal 2",
  values: readonly unknown[],
): void {
  for (const version of values) {
    const bundle = cloneBundle(
      createValidSnapshotBundleWithObjectOptionalsFixture(),
    );
    const document = bundle[root] as Record<string, unknown>;
    document.version = version;

    try {
      parseSnapshotsBundle(bundle);
      expect.unreachable(`expected incompatible ${root}.version=${String(version)}`);
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      expect((error as SnapshotBundleValidationError).issues).toContainEqual({
        path: `$.${root}.version`,
        code: "INVALID_VALUE",
        expected: expectedLiteral,
      });
    }
  }

  const deleted = cloneBundle(
    createValidSnapshotBundleWithObjectOptionalsFixture(),
  );
  delete (deleted[root] as Record<string, unknown>).version;
  try {
    parseSnapshotsBundle(deleted);
    expect.unreachable(`expected missing ${root}.version`);
  } catch (error) {
    expect(error).toBeInstanceOf(SnapshotBundleValidationError);
    expect((error as SnapshotBundleValidationError).issues).toContainEqual({
      path: `$.${root}.version`,
      code: "REQUIRED",
      expected: expectedLiteral,
    });
  }
}

describe("current snapshot document compatibility", () => {
  it("accepts exact current versions for every snapshot document", () => {
    const bundle = createValidSnapshotBundleWithObjectOptionalsFixture();
    const parsed = parseSnapshotsBundle(bundle);
    expect(parsed).toBe(bundle);
    expect((parsed.catalog as { version: number }).version).toBe(2);
    expect((parsed.map as { version: number }).version).toBe(2);
    expect((parsed.site as { version: number }).version).toBe(2);
    expect((parsed.manifest as { version: number }).version).toBe(2);
    expect((parsed.offers as { version: number }).version).toBe(1);
  });

  it("accepts null for unavailable manifest and offers documents", () => {
    const bundle = createValidSnapshotBundleFixture();
    const parsed = parseSnapshotsBundle(bundle);
    expect(parsed).toBe(bundle);
    expect(parsed.manifest).toBeNull();
    expect(parsed.offers).toBeNull();
  });

  it("preserves additive document fields by identity", () => {
    const bundle = createValidSnapshotBundleWithObjectOptionalsFixture();
    const catalogMarker = { kind: "synthetic-catalog-additive" };
    const mapMarker = { kind: "synthetic-map-additive" };
    const siteMarker = { kind: "synthetic-site-additive" };
    const manifestMarker = { kind: "synthetic-manifest-additive" };
    const offersMarker = { kind: "synthetic-offers-additive" };

    (bundle.catalog as Record<string, unknown>).additive = catalogMarker;
    (bundle.map as Record<string, unknown>).additive = mapMarker;
    (bundle.site as Record<string, unknown>).additive = siteMarker;
    (bundle.manifest as Record<string, unknown>).additive = manifestMarker;
    (bundle.offers as Record<string, unknown>).additive = offersMarker;

    const parsed = parseSnapshotsBundle(bundle);
    expect(parsed).toBe(bundle);
    expect((parsed.catalog as Record<string, unknown>).additive).toBe(
      catalogMarker,
    );
    expect((parsed.map as Record<string, unknown>).additive).toBe(mapMarker);
    expect((parsed.site as Record<string, unknown>).additive).toBe(siteMarker);
    expect((parsed.manifest as Record<string, unknown>).additive).toBe(
      manifestMarker,
    );
    expect((parsed.offers as Record<string, unknown>).additive).toBe(
      offersMarker,
    );
  });

  it("exposes a frozen current snapshot version map", () => {
    expect(CURRENT_SNAPSHOT_VERSIONS).toEqual({
      catalog: 2,
      map: 2,
      site: 2,
      manifest: 2,
      offers: 1,
    });
    expect(Object.isFrozen(CURRENT_SNAPSHOT_VERSIONS)).toBe(true);
    expect(Object.keys(CURRENT_SNAPSHOT_VERSIONS)).toEqual([
      "catalog",
      "map",
      "site",
      "manifest",
      "offers",
    ]);
  });

  it("rejects every missing catalog top-level field", () => {
    expectRequiredField("catalog", "version", "literal 2");
    expectRequiredField("catalog", "generatedAt", "string");
    expectRequiredField("catalog", "source", "string");
    expectRequiredField("catalog", "integrity", "object");
    expectRequiredField("catalog", "worlds", "array");
    expectRequiredField("catalog", "courses", "array");
    expect(CATALOG_FIELDS).toHaveLength(6);
  });

  it("rejects incompatible catalog version values", () => {
    expectIncompatibleVersions("catalog", "literal 2", INCOMPATIBLE_V2_VALUES);
  });

  it("rejects every missing map top-level field", () => {
    expectRequiredField("map", "version", "literal 2");
    expectRequiredField("map", "generatedAt", "string");
    expectRequiredField("map", "source", "string");
    expectRequiredField("map", "integrity", "object");
    expectRequiredField("map", "venues", "array");
    expect(MAP_FIELDS).toHaveLength(5);
  });

  it("rejects incompatible map version values", () => {
    expectIncompatibleVersions("map", "literal 2", INCOMPATIBLE_V2_VALUES);
  });

  it("rejects every missing site top-level field", () => {
    expectRequiredField("site", "version", "literal 2");
    expectRequiredField("site", "generatedAt", "string");
    expectRequiredField("site", "source", "string");
    expectRequiredField("site", "brand", "object");
    expectRequiredField("site", "navigation", "object");
    expectRequiredField("site", "cities", "array");
    expect(SITE_FIELDS).toHaveLength(6);
  });

  it("rejects incompatible site version values", () => {
    expectIncompatibleVersions("site", "literal 2", INCOMPATIBLE_V2_VALUES);
  });

  it("rejects every missing manifest top-level field when manifest is present", () => {
    expectRequiredField("manifest", "version", "literal 2");
    expectRequiredField("manifest", "generatedAt", "string");
    expectRequiredField("manifest", "source", "string");
    expectRequiredField("manifest", "snapshots", "object");
    expect(MANIFEST_FIELDS).toHaveLength(4);
  });

  it("rejects incompatible manifest version values", () => {
    expectIncompatibleVersions("manifest", "literal 2", INCOMPATIBLE_V2_VALUES);
  });

  it("rejects every missing offers top-level field when offers is present", () => {
    expectRequiredField("offers", "version", "literal 1");
    expectRequiredField("offers", "generatedAt", "string");
    expectRequiredField("offers", "source", "string");
    expectRequiredField("offers", "offersByQuest", "object");
    expect(OFFERS_FIELDS).toHaveLength(4);
  });

  it("rejects incompatible offers version values", () => {
    expectIncompatibleVersions("offers", "literal 1", INCOMPATIBLE_V1_VALUES);
  });

  it("rejects wrong top-level field kinds without exposing raw values", () => {
    const marker = "SYNTHETIC_PRIVATE_SNAPSHOT_CONTRACT_M1_09";
    const bundle = cloneBundle(
      createValidSnapshotBundleWithObjectOptionalsFixture(),
    );
    (bundle.catalog as Record<string, unknown>).generatedAt = {
      leak: marker,
    };
    (bundle.map as Record<string, unknown>).venues = { leak: marker };
    (bundle.site as Record<string, unknown>).brand = marker;

    try {
      parseSnapshotsBundle(bundle);
      expect.unreachable("expected kind failures");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      const validationError = error as SnapshotBundleValidationError;
      expect(validationError.issues).toEqual([
        {
          path: "$.catalog.generatedAt",
          code: "INVALID_TYPE",
          expected: "string",
        },
        {
          path: "$.map.venues",
          code: "INVALID_TYPE",
          expected: "array",
        },
        {
          path: "$.site.brand",
          code: "INVALID_TYPE",
          expected: "object",
        },
      ]);
      expect(validationError.message).not.toContain(marker);
      expect(String(validationError)).not.toContain(marker);
      expect(JSON.stringify(validationError)).not.toContain(marker);
      for (const issue of validationError.issues) {
        expect(JSON.stringify(issue)).not.toContain(marker);
        expect(Object.keys(issue).sort()).toEqual(["code", "expected", "path"]);
      }
    }
  });

  it("caps nested contract diagnostics at five issues", () => {
    const bundle = cloneBundle(createValidSnapshotBundleFixture());
    const catalog = bundle.catalog as Record<string, unknown>;
    for (const field of CATALOG_FIELDS) {
      delete catalog[field];
    }

    try {
      parseSnapshotsBundle(bundle);
      expect.unreachable("expected capped nested failures");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      const issues = (error as SnapshotBundleValidationError).issues;
      expect(issues).toHaveLength(5);
      expect(issues).toEqual([
        {
          path: "$.catalog.version",
          code: "REQUIRED",
          expected: "literal 2",
        },
        {
          path: "$.catalog.generatedAt",
          code: "REQUIRED",
          expected: "string",
        },
        {
          path: "$.catalog.source",
          code: "REQUIRED",
          expected: "string",
        },
        {
          path: "$.catalog.integrity",
          code: "REQUIRED",
          expected: "object",
        },
        {
          path: "$.catalog.worlds",
          code: "REQUIRED",
          expected: "array",
        },
      ]);
    }
  });

  it("distinguishes nullable unavailability from an incompatible object document", () => {
    const nullable = createValidSnapshotBundleFixture();
    expect(parseSnapshotsBundle(nullable)).toBe(nullable);

    const emptyObject = cloneBundle(createValidSnapshotBundleFixture());
    emptyObject.manifest = {};
    try {
      parseSnapshotsBundle(emptyObject);
      expect.unreachable("expected empty manifest object failure");
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotBundleValidationError);
      expect((error as SnapshotBundleValidationError).issues[0]).toEqual({
        path: "$.manifest.version",
        code: "REQUIRED",
        expected: "literal 2",
      });
    }
  });

  it("accepts null-prototype objects for required object fields", () => {
    const bundle = cloneBundle(
      createValidSnapshotBundleWithObjectOptionalsFixture(),
    );
    (bundle.catalog as Record<string, unknown>).integrity = Object.assign(
      Object.create(null),
      { contentHash: "synthetic-content-hash" },
    );
    (bundle.site as Record<string, unknown>).brand = Object.create(null);
    (bundle.manifest as Record<string, unknown>).snapshots = Object.create(null);
    (bundle.offers as Record<string, unknown>).offersByQuest =
      Object.create(null);

    const parsed = parseSnapshotsBundle(bundle);
    expect(parsed).toBe(bundle);
  });
});
