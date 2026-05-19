/** Keys that must not appear in public CDN/S3 JSON (any nesting depth). */
export const PRIVATE_FIELD_DENYLIST = [
  "manageremail",
  "managerphone",
  "internalnote",
  "draft",
  "crmsecret",
  "apikey",
  "password",
  "serviceaccount",
  "privatekey",
  "sheetrowid",
] as const;

export type PrivateFieldViolation = {
  path: string;
  key: string;
};

export function findPrivateFieldViolations(
  value: unknown,
  path = "",
): PrivateFieldViolation[] {
  const violations: PrivateFieldViolation[] = [];

  if (value === null || typeof value !== "object") {
    return violations;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      violations.push(...findPrivateFieldViolations(item, `${path}[${index}]`));
    });
    return violations;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.toLowerCase();
    const nextPath = path ? `${path}.${key}` : key;

    if (PRIVATE_FIELD_DENYLIST.some((denied) => normalized.includes(denied))) {
      violations.push({ path: nextPath, key });
    }

    violations.push(...findPrivateFieldViolations(nested, nextPath));
  }

  return violations;
}

export function assertNoPrivateFields(value: unknown): void {
  const violations = findPrivateFieldViolations(value);
  if (violations.length === 0) return;

  const sample = violations
    .slice(0, 5)
    .map((v) => v.path)
    .join(", ");
  throw new Error(
    `Public snapshot contains denylisted private fields: ${sample}${
      violations.length > 5 ? ` (+${violations.length - 5} more)` : ""
    }`,
  );
}
