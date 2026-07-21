import { describe, expect, it } from "vitest";

import {
  parseSnapshotsBundle,
  SnapshotBundleValidationError,
} from "./snapshot-boundary";
import {
  createInvalidSnapshotBundleFixtures,
  createValidSnapshotBundleFixture,
  createValidSnapshotBundleWithObjectOptionalsFixture,
  type InvalidSnapshotBundleFixtureId,
} from "./test-fixtures/snapshot-bundle.fixtures";

const CLOSED_STRING_VOCABULARY = new Set([
  "synthetic-catalog",
  "synthetic-map",
  "synthetic-site",
  "synthetic-manifest",
  "synthetic-offers",
  "synthetic-additive",
  "synthetic-invalid",
  "root-null",
  "ok-false",
  "missing-catalog",
  "catalog-array",
  "missing-manifest",
  "offers-string",
  "$",
  "$.ok",
  "$.catalog",
  "$.map",
  "$.site",
  "$.manifest",
  "$.offers",
  "REQUIRED",
  "INVALID_TYPE",
  "INVALID_VALUE",
  "literal true",
  "object",
  "object|null",
]);

const SECRET_LIKE =
  /token|secret|password|authorization|bearer|api[-_]?key/i;
const PHONE_LIKE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const ISO_DATE = /\d{4}-\d{2}-\d{2}/;
const UUID_LIKE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (value === null || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
    return;
  }
  for (const nested of Object.values(value as Record<string, unknown>)) {
    collectStrings(nested, out);
  }
}

describe("synthetic snapshot fixtures", () => {
  it("creates a valid nullable snapshot bundle fixture", () => {
    const fixture = createValidSnapshotBundleFixture();
    const parsed = parseSnapshotsBundle(fixture);
    expect(parsed).toBe(fixture);
    expect(parsed.manifest).toBeNull();
    expect(parsed.offers).toBeNull();
  });

  it("creates a valid object-valued snapshot bundle fixture", () => {
    const fixture = createValidSnapshotBundleWithObjectOptionalsFixture();
    const parsed = parseSnapshotsBundle(fixture);
    expect(parsed).toBe(fixture);
    expect(parsed.manifest).toEqual({ fixtureKind: "synthetic-manifest" });
    expect(parsed.offers).toEqual({ fixtureKind: "synthetic-offers" });
  });

  it("keeps every invalid fixture invalid with the expected first issue", () => {
    const fixtures = createInvalidSnapshotBundleFixtures();
    const seen = new Set<InvalidSnapshotBundleFixtureId>();

    expect(fixtures).toHaveLength(6);

    for (const fixture of fixtures) {
      expect(seen.has(fixture.id)).toBe(false);
      seen.add(fixture.id);

      try {
        parseSnapshotsBundle(fixture.input);
        expect.unreachable(`expected ${fixture.id} to be invalid`);
      } catch (error) {
        expect(error).toBeInstanceOf(SnapshotBundleValidationError);
        const validationError = error as SnapshotBundleValidationError;
        expect(validationError.issues.length).toBeLessThanOrEqual(5);
        expect(validationError.issues.length).toBeGreaterThanOrEqual(1);
        expect(validationError.issues[0]).toEqual(fixture.expectedFirstIssue);
      }
    }

    expect([...seen].sort()).toEqual(
      [
        "catalog-array",
        "missing-catalog",
        "missing-manifest",
        "offers-string",
        "ok-false",
        "root-null",
      ].sort(),
    );
  });

  it("returns deterministic fresh fixture object graphs", () => {
    const validA = createValidSnapshotBundleFixture();
    const validB = createValidSnapshotBundleFixture();
    expect(validA).toEqual(validB);
    expect(validA).not.toBe(validB);
    expect(validA.catalog).not.toBe(validB.catalog);
    expect(validA.map).not.toBe(validB.map);
    expect(validA.site).not.toBe(validB.site);
    expect(validA.fixtureMetadata).not.toBe(validB.fixtureMetadata);
    (validA.catalog as { fixtureKind: string }).fixtureKind = "mutated";
    expect(validB.catalog).toEqual({ fixtureKind: "synthetic-catalog" });

    const objectA = createValidSnapshotBundleWithObjectOptionalsFixture();
    const objectB = createValidSnapshotBundleWithObjectOptionalsFixture();
    expect(objectA).toEqual(objectB);
    expect(objectA).not.toBe(objectB);
    expect(objectA.catalog).not.toBe(objectB.catalog);
    expect(objectA.manifest).not.toBe(objectB.manifest);
    expect(objectA.offers).not.toBe(objectB.offers);
    expect(objectA.catalog).not.toBe(validA.catalog);
    (objectA.manifest as { fixtureKind: string }).fixtureKind = "mutated";
    expect(objectB.manifest).toEqual({ fixtureKind: "synthetic-manifest" });

    const invalidA = createInvalidSnapshotBundleFixtures();
    const invalidB = createInvalidSnapshotBundleFixtures();
    expect(invalidA).toEqual(invalidB);
    expect(invalidA).not.toBe(invalidB);
    for (let index = 0; index < invalidA.length; index += 1) {
      expect(invalidA[index]).not.toBe(invalidB[index]);
      if (
        invalidA[index].input !== null &&
        typeof invalidA[index].input === "object"
      ) {
        expect(invalidA[index].input).not.toBe(invalidB[index].input);
      }
      expect(invalidA[index].expectedFirstIssue).not.toBe(
        invalidB[index].expectedFirstIssue,
      );
    }

    const catalogArray = invalidA.find((row) => row.id === "catalog-array");
    expect(catalogArray).toBeDefined();
    const catalogInput = catalogArray!.input as {
      catalog: unknown[];
      map: { fixtureKind: string };
    };
    catalogInput.map.fixtureKind = "mutated";
    const catalogArrayB = invalidB.find((row) => row.id === "catalog-array");
    expect(
      (catalogArrayB!.input as { map: { fixtureKind: string } }).map,
    ).toEqual({ fixtureKind: "synthetic-map" });
  });

  it("keeps fixture data bounded and inside the closed synthetic vocabulary", () => {
    const strings: string[] = [];
    collectStrings(createValidSnapshotBundleFixture(), strings);
    collectStrings(
      createValidSnapshotBundleWithObjectOptionalsFixture(),
      strings,
    );
    collectStrings(createInvalidSnapshotBundleFixtures(), strings);

    for (const value of strings) {
      expect(CLOSED_STRING_VOCABULARY.has(value)).toBe(true);
      expect(value.includes("@")).toBe(false);
      expect(value.includes("://")).toBe(false);
      expect(SECRET_LIKE.test(value)).toBe(false);
      expect(PHONE_LIKE.test(value)).toBe(false);
      expect(ISO_DATE.test(value)).toBe(false);
      expect(UUID_LIKE.test(value)).toBe(false);
    }

    const serialized = JSON.stringify({
      validNullable: createValidSnapshotBundleFixture(),
      validObjects: createValidSnapshotBundleWithObjectOptionalsFixture(),
      invalid: createInvalidSnapshotBundleFixtures(),
    });
    expect(new TextEncoder().encode(serialized).byteLength).toBeLessThanOrEqual(
      4096,
    );
  });
});
