/**
 * Resolves a manifest-relative path to a public HTTP URL when S3/CDN is configured.
 */

/** Yandex Object Storage — dev fallback when NEXT_PUBLIC_S3_PUBLIC_BASE_URL is unset. */
export const DEFAULT_PUBLIC_S3_BASE_URL =
  "https://storage.yandexcloud.net/bm-questhub";

function normalizeBase(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

function envS3BaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  return base && base.length > 0 ? base : null;
}

/**
 * Public base from NEXT_PUBLIC_S3_PUBLIC_BASE_URL (no trailing slash in env is ok).
 * In `next dev`, falls back to {@link DEFAULT_PUBLIC_S3_BASE_URL} so media matches production.
 */
export function publicS3BaseUrl(): string | null {
  const fromEnv = envS3BaseUrl();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") return DEFAULT_PUBLIC_S3_BASE_URL;
  return null;
}

/**
 * Path-style S3 URL → bucket root (`https://host/<bucket>/`).
 * Manifest paths in site-manifest.json are relative to bucket root, not the manifest file directory.
 */
export function snapshotBaseUrlFromManifest(manifestUrl: string): string | null {
  try {
    const u = new URL(manifestUrl);
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;
    const bucket = segments[0];
    return `${u.origin}/${bucket}/`;
  } catch {
    return null;
  }
}

function resolveAgainstBase(relativePath: string, base: string): string | null {
  try {
    return new URL(relativePath, normalizeBase(base)).toString();
  } catch {
    return null;
  }
}

/**
 * Build URL for a path like `data/v2/site-manifest.json` using S3 bucket base.
 * When `manifestUrl` is passed (full URL to site-manifest.json), it only signals remote
 * mode — resolution uses bucket root, not the manifest file path as URL base.
 */
export function resolvePublicSnapshotUrl(
  relativePath: string,
  options?: { manifestUrl?: string | null },
): string | null {
  const path = relativePath.replace(/^\//, "");
  const manifestUrl = options?.manifestUrl?.trim();

  if (manifestUrl) {
    const base =
      publicS3BaseUrl() ?? snapshotBaseUrlFromManifest(manifestUrl);
    if (base) return resolveAgainstBase(path, base);
  }

  if (process.env.SITE_SNAPSHOT_SOURCE !== "s3") return null;

  const base = publicS3BaseUrl();
  if (!base) return null;

  return resolveAgainstBase(path, base);
}
