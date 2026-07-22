export const SNAPSHOT_NAMES = [
  "catalog",
  "map",
  "site",
  "manifest",
  "offers",
] as const;

export type SnapshotName = (typeof SNAPSHOT_NAMES)[number];

export type SnapshotDocument = Record<string, unknown>;

export type SnapshotsBundle = {
  ok: true;
  catalog: SnapshotDocument;
  map: SnapshotDocument;
  site: SnapshotDocument;
  manifest: SnapshotDocument | null;
  offers: SnapshotDocument | null;
  [key: string]: unknown;
};

export const CURRENT_SNAPSHOT_VERSIONS = Object.freeze({
  catalog: 2,
  map: 2,
  site: 2,
  manifest: 2,
  offers: 1,
} as const);

export type SnapshotBundleValidationIssueCode =
  | "REQUIRED"
  | "INVALID_TYPE"
  | "INVALID_VALUE";

export type SnapshotBundleValidationExpected =
  | "literal true"
  | "literal 1"
  | "literal 2"
  | "string"
  | "array"
  | "object"
  | "object|null";

export type SnapshotBundleValidationIssue = {
  readonly path: string;
  readonly code: SnapshotBundleValidationIssueCode;
  readonly expected: SnapshotBundleValidationExpected;
};

export class SnapshotBundleValidationError extends Error {
  readonly name = "SnapshotBundleValidationError";
  readonly code = "SNAPSHOT_BUNDLE_INVALID";

  constructor(readonly issues: readonly SnapshotBundleValidationIssue[]) {
    super("Snapshot bundle failed validation");
  }
}

const MAX_ISSUES = 5;

const OBJECT_ROOTS = ["catalog", "map", "site"] as const;
const NULLABLE_ROOTS = ["manifest", "offers"] as const;

type DocumentFieldKind = "version" | "string" | "array" | "object";

type DocumentFieldContract = {
  readonly name: string;
  readonly kind: DocumentFieldKind;
};

const CATALOG_FIELDS: readonly DocumentFieldContract[] = [
  { name: "version", kind: "version" },
  { name: "generatedAt", kind: "string" },
  { name: "source", kind: "string" },
  { name: "integrity", kind: "object" },
  { name: "worlds", kind: "array" },
  { name: "courses", kind: "array" },
];

const MAP_FIELDS: readonly DocumentFieldContract[] = [
  { name: "version", kind: "version" },
  { name: "generatedAt", kind: "string" },
  { name: "source", kind: "string" },
  { name: "integrity", kind: "object" },
  { name: "venues", kind: "array" },
];

const SITE_FIELDS: readonly DocumentFieldContract[] = [
  { name: "version", kind: "version" },
  { name: "generatedAt", kind: "string" },
  { name: "source", kind: "string" },
  { name: "brand", kind: "object" },
  { name: "navigation", kind: "object" },
  { name: "cities", kind: "array" },
];

const MANIFEST_FIELDS: readonly DocumentFieldContract[] = [
  { name: "version", kind: "version" },
  { name: "generatedAt", kind: "string" },
  { name: "source", kind: "string" },
  { name: "snapshots", kind: "object" },
];

const OFFERS_FIELDS: readonly DocumentFieldContract[] = [
  { name: "version", kind: "version" },
  { name: "generatedAt", kind: "string" },
  { name: "source", kind: "string" },
  { name: "offersByQuest", kind: "object" },
];

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function pushIssue(
  issues: SnapshotBundleValidationIssue[],
  issue: SnapshotBundleValidationIssue,
): void {
  if (issues.length < MAX_ISSUES) {
    issues.push(issue);
  }
}

function versionExpected(
  version: 1 | 2,
): "literal 1" | "literal 2" {
  return version === 1 ? "literal 1" : "literal 2";
}

function fieldExpected(
  field: DocumentFieldContract,
  version: 1 | 2,
): SnapshotBundleValidationExpected {
  switch (field.kind) {
    case "version":
      return versionExpected(version);
    case "string":
      return "string";
    case "array":
      return "array";
    case "object":
      return "object";
  }
}

function validateDocumentFields(
  issues: SnapshotBundleValidationIssue[],
  rootPath: string,
  document: Record<string, unknown>,
  version: 1 | 2,
  fields: readonly DocumentFieldContract[],
): void {
  for (const field of fields) {
    const path = `${rootPath}.${field.name}`;
    if (!hasOwn(document, field.name)) {
      pushIssue(issues, {
        path,
        code: "REQUIRED",
        expected: fieldExpected(field, version),
      });
      continue;
    }

    const value = document[field.name];
    switch (field.kind) {
      case "version":
        if (value !== version) {
          pushIssue(issues, {
            path,
            code: "INVALID_VALUE",
            expected: versionExpected(version),
          });
        }
        break;
      case "string":
        if (typeof value !== "string") {
          pushIssue(issues, {
            path,
            code: "INVALID_TYPE",
            expected: "string",
          });
        }
        break;
      case "array":
        if (!Array.isArray(value)) {
          pushIssue(issues, {
            path,
            code: "INVALID_TYPE",
            expected: "array",
          });
        }
        break;
      case "object":
        if (!isPlainRecord(value)) {
          pushIssue(issues, {
            path,
            code: "INVALID_TYPE",
            expected: "object",
          });
        }
        break;
    }
  }
}

function validateSnapshotDocuments(
  issues: SnapshotBundleValidationIssue[],
  input: Record<string, unknown>,
): void {
  validateDocumentFields(
    issues,
    "$.catalog",
    input.catalog as Record<string, unknown>,
    CURRENT_SNAPSHOT_VERSIONS.catalog,
    CATALOG_FIELDS,
  );
  validateDocumentFields(
    issues,
    "$.map",
    input.map as Record<string, unknown>,
    CURRENT_SNAPSHOT_VERSIONS.map,
    MAP_FIELDS,
  );
  validateDocumentFields(
    issues,
    "$.site",
    input.site as Record<string, unknown>,
    CURRENT_SNAPSHOT_VERSIONS.site,
    SITE_FIELDS,
  );

  if (input.manifest !== null) {
    validateDocumentFields(
      issues,
      "$.manifest",
      input.manifest as Record<string, unknown>,
      CURRENT_SNAPSHOT_VERSIONS.manifest,
      MANIFEST_FIELDS,
    );
  }

  if (input.offers !== null) {
    validateDocumentFields(
      issues,
      "$.offers",
      input.offers as Record<string, unknown>,
      CURRENT_SNAPSHOT_VERSIONS.offers,
      OFFERS_FIELDS,
    );
  }
}

export function parseSnapshotsBundle(input: unknown): SnapshotsBundle {
  const issues: SnapshotBundleValidationIssue[] = [];

  if (!isPlainRecord(input)) {
    pushIssue(issues, {
      path: "$",
      code: "INVALID_TYPE",
      expected: "object",
    });
    throw new SnapshotBundleValidationError(issues);
  }

  if (!hasOwn(input, "ok")) {
    pushIssue(issues, {
      path: "$.ok",
      code: "REQUIRED",
      expected: "literal true",
    });
  } else if (input.ok !== true) {
    pushIssue(issues, {
      path: "$.ok",
      code: "INVALID_VALUE",
      expected: "literal true",
    });
  }

  for (const key of OBJECT_ROOTS) {
    if (!hasOwn(input, key)) {
      pushIssue(issues, {
        path: `$.${key}`,
        code: "REQUIRED",
        expected: "object",
      });
    } else if (!isPlainRecord(input[key])) {
      pushIssue(issues, {
        path: `$.${key}`,
        code: "INVALID_TYPE",
        expected: "object",
      });
    }
  }

  for (const key of NULLABLE_ROOTS) {
    if (!hasOwn(input, key)) {
      pushIssue(issues, {
        path: `$.${key}`,
        code: "REQUIRED",
        expected: "object|null",
      });
    } else if (input[key] !== null && !isPlainRecord(input[key])) {
      pushIssue(issues, {
        path: `$.${key}`,
        code: "INVALID_TYPE",
        expected: "object|null",
      });
    }
  }

  if (issues.length > 0) {
    throw new SnapshotBundleValidationError(issues);
  }

  validateSnapshotDocuments(issues, input);

  if (issues.length > 0) {
    throw new SnapshotBundleValidationError(issues);
  }

  return input as SnapshotsBundle;
}
