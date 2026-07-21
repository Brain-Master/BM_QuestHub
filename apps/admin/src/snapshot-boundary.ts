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

export type SnapshotBundleValidationIssueCode =
  | "REQUIRED"
  | "INVALID_TYPE"
  | "INVALID_VALUE";

export type SnapshotBundleValidationExpected =
  | "literal true"
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

  return input as SnapshotsBundle;
}
