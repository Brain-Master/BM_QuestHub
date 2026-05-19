/**
 * Resolves a manifest-relative path to a public HTTP URL when S3/CDN is configured.
 */

function normalizeBase(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

/** Public base from NEXT_PUBLIC_S3_PUBLIC_BASE_URL (no trailing slash in env is ok). */
export function publicS3BaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  return base && base.length > 0 ? base : null;
}

/**
 * Build URL for a path like `data/v2/site-manifest.json` using manifest URL or S3 base.
 */
export function resolvePublicSnapshotUrl(
  relativePath: string,
  options?: { manifestUrl?: string | null },
): string | null {
  const path = relativePath.replace(/^\//, "");
  const manifestUrl = options?.manifestUrl?.trim();

  if (manifestUrl) {
    try {
      return new URL(path, normalizeBase(manifestUrl)).toString();
    } catch {
      /* fall through */
    }
  }

  if (process.env.SITE_SNAPSHOT_SOURCE !== "s3") return null;

  const base = publicS3BaseUrl();
  if (!base) return null;

  try {
    return new URL(path, normalizeBase(base)).toString();
  } catch {
    return null;
  }
}
