import type {
  SnapshotBundleValidationExpected,
  SnapshotBundleValidationIssueCode,
  SnapshotDocument,
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

const SYNTHETIC_GENERATED_AT = "synthetic-generated-at";
const SYNTHETIC_SOURCE = "synthetic-source";
const SYNTHETIC_CONTENT_HASH = "synthetic-content-hash";

function createSyntheticCatalog(): SnapshotDocument {
  return {
    version: 2,
    generatedAt: SYNTHETIC_GENERATED_AT,
    source: SYNTHETIC_SOURCE,
    integrity: { contentHash: SYNTHETIC_CONTENT_HASH },
    worlds: [],
    courses: [],
    fixtureKind: "synthetic-catalog",
  };
}

function createSyntheticMap(): SnapshotDocument {
  return {
    version: 2,
    generatedAt: SYNTHETIC_GENERATED_AT,
    source: SYNTHETIC_SOURCE,
    integrity: { contentHash: SYNTHETIC_CONTENT_HASH },
    venues: [],
    fixtureKind: "synthetic-map",
  };
}

function createSyntheticSite(): SnapshotDocument {
  return {
    version: 2,
    generatedAt: SYNTHETIC_GENERATED_AT,
    source: SYNTHETIC_SOURCE,
    brand: {},
    navigation: {},
    cities: [],
    fixtureKind: "synthetic-site",
  };
}

function createSyntheticManifest(): SnapshotDocument {
  return {
    version: 2,
    generatedAt: SYNTHETIC_GENERATED_AT,
    source: SYNTHETIC_SOURCE,
    snapshots: {},
    fixtureKind: "synthetic-manifest",
  };
}

function createSyntheticOffers(): SnapshotDocument {
  return {
    version: 1,
    generatedAt: SYNTHETIC_GENERATED_AT,
    source: SYNTHETIC_SOURCE,
    offersByQuest: {},
    fixtureKind: "synthetic-offers",
  };
}

function createCompatibleRootDocs(): {
  catalog: SnapshotDocument;
  map: SnapshotDocument;
  site: SnapshotDocument;
} {
  return {
    catalog: {
      version: 2,
      generatedAt: SYNTHETIC_GENERATED_AT,
      source: SYNTHETIC_SOURCE,
      integrity: {},
      worlds: [],
      courses: [],
    },
    map: {
      version: 2,
      generatedAt: SYNTHETIC_GENERATED_AT,
      source: SYNTHETIC_SOURCE,
      integrity: {},
      venues: [],
    },
    site: {
      version: 2,
      generatedAt: SYNTHETIC_GENERATED_AT,
      source: SYNTHETIC_SOURCE,
      brand: {},
      navigation: {},
      cities: [],
    },
  };
}

export function createValidSnapshotBundleFixture(): SnapshotsBundle {
  return {
    ok: true,
    catalog: createSyntheticCatalog(),
    map: createSyntheticMap(),
    site: createSyntheticSite(),
    manifest: null,
    offers: null,
    fixtureMetadata: { fixtureKind: "synthetic-additive" },
  };
}

export function createValidSnapshotBundleWithObjectOptionalsFixture(): SnapshotsBundle {
  return {
    ok: true,
    catalog: createSyntheticCatalog(),
    map: createSyntheticMap(),
    site: createSyntheticSite(),
    manifest: createSyntheticManifest(),
    offers: createSyntheticOffers(),
  };
}

export function createInvalidSnapshotBundleFixtures(): readonly InvalidSnapshotBundleFixture[] {
  const okRoots = createCompatibleRootDocs();
  const okFalseInput = {
    ok: false as const,
    catalog: okRoots.catalog,
    map: okRoots.map,
    site: okRoots.site,
    manifest: null,
    offers: null,
  };

  const missingCatalogRoots = createCompatibleRootDocs();
  const missingCatalogInput = {
    ok: true as const,
    map: missingCatalogRoots.map,
    site: missingCatalogRoots.site,
    manifest: null,
    offers: null,
  };

  const catalogArrayRoots = createCompatibleRootDocs();
  const catalogArrayInput = {
    ok: true as const,
    catalog: [] as unknown[],
    map: catalogArrayRoots.map,
    site: catalogArrayRoots.site,
    manifest: null,
    offers: null,
  };

  const missingManifestRoots = createCompatibleRootDocs();
  const missingManifestInput = {
    ok: true as const,
    catalog: missingManifestRoots.catalog,
    map: missingManifestRoots.map,
    site: missingManifestRoots.site,
    offers: null,
  };

  const offersStringRoots = createCompatibleRootDocs();
  const offersStringInput = {
    ok: true as const,
    catalog: offersStringRoots.catalog,
    map: offersStringRoots.map,
    site: offersStringRoots.site,
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
