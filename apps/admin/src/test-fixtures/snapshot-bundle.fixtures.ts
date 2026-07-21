import type {
  SnapshotBundleValidationExpected,
  SnapshotBundleValidationIssueCode,
  SnapshotsBundle,
} from "../snapshot-boundary";

export type InvalidSnapshotBundleFixtureId =
  | "root-null"
  | "ok-false"
  | "missing-catalog"
  | "catalog-array"
  | "missing-manifest"
  | "offers-string";

export type InvalidSnapshotBundleFixture = {
  readonly id: InvalidSnapshotBundleFixtureId;
  readonly input: unknown;
  readonly expectedFirstIssue: {
    readonly path: string;
    readonly code: SnapshotBundleValidationIssueCode;
    readonly expected: SnapshotBundleValidationExpected;
  };
};

export function createValidSnapshotBundleFixture(): SnapshotsBundle {
  return {
    ok: true,
    catalog: { fixtureKind: "synthetic-catalog" },
    map: { fixtureKind: "synthetic-map" },
    site: { fixtureKind: "synthetic-site" },
    manifest: null,
    offers: null,
    fixtureMetadata: { fixtureKind: "synthetic-additive" },
  };
}

export function createValidSnapshotBundleWithObjectOptionalsFixture(): SnapshotsBundle {
  return {
    ok: true,
    catalog: { fixtureKind: "synthetic-catalog" },
    map: { fixtureKind: "synthetic-map" },
    site: { fixtureKind: "synthetic-site" },
    manifest: { fixtureKind: "synthetic-manifest" },
    offers: { fixtureKind: "synthetic-offers" },
  };
}

export function createInvalidSnapshotBundleFixtures(): readonly InvalidSnapshotBundleFixture[] {
  const okFalseInput = {
    ok: false as const,
    catalog: { fixtureKind: "synthetic-catalog" },
    map: { fixtureKind: "synthetic-map" },
    site: { fixtureKind: "synthetic-site" },
    manifest: null,
    offers: null,
  };

  const missingCatalogInput = {
    ok: true as const,
    map: { fixtureKind: "synthetic-map" },
    site: { fixtureKind: "synthetic-site" },
    manifest: null,
    offers: null,
  };

  const catalogArrayInput = {
    ok: true as const,
    catalog: [] as unknown[],
    map: { fixtureKind: "synthetic-map" },
    site: { fixtureKind: "synthetic-site" },
    manifest: null,
    offers: null,
  };

  const missingManifestInput = {
    ok: true as const,
    catalog: { fixtureKind: "synthetic-catalog" },
    map: { fixtureKind: "synthetic-map" },
    site: { fixtureKind: "synthetic-site" },
    offers: null,
  };

  const offersStringInput = {
    ok: true as const,
    catalog: { fixtureKind: "synthetic-catalog" },
    map: { fixtureKind: "synthetic-map" },
    site: { fixtureKind: "synthetic-site" },
    manifest: null,
    offers: "synthetic-invalid",
  };

  return [
    {
      id: "root-null",
      input: null,
      expectedFirstIssue: {
        path: "$",
        code: "INVALID_TYPE",
        expected: "object",
      },
    },
    {
      id: "ok-false",
      input: okFalseInput,
      expectedFirstIssue: {
        path: "$.ok",
        code: "INVALID_VALUE",
        expected: "literal true",
      },
    },
    {
      id: "missing-catalog",
      input: missingCatalogInput,
      expectedFirstIssue: {
        path: "$.catalog",
        code: "REQUIRED",
        expected: "object",
      },
    },
    {
      id: "catalog-array",
      input: catalogArrayInput,
      expectedFirstIssue: {
        path: "$.catalog",
        code: "INVALID_TYPE",
        expected: "object",
      },
    },
    {
      id: "missing-manifest",
      input: missingManifestInput,
      expectedFirstIssue: {
        path: "$.manifest",
        code: "REQUIRED",
        expected: "object|null",
      },
    },
    {
      id: "offers-string",
      input: offersStringInput,
      expectedFirstIssue: {
        path: "$.offers",
        code: "INVALID_TYPE",
        expected: "object|null",
      },
    },
  ];
}
