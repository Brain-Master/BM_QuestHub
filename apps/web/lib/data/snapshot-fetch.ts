/**
 * Fetch options for public snapshot URLs during Next static export.
 * `cache: "no-store"` forces dynamic rendering and breaks `output: "export"` for
 * non-snapshot routes; use it only when pulling versioned JSON from S3 at build time.
 */
export function snapshotFetchInit(): RequestInit {
  if (process.env.SITE_SNAPSHOT_SOURCE === "s3") {
    return { cache: "no-store" };
  }
  return process.env.NODE_ENV === "production"
    ? { cache: "force-cache" }
    : { cache: "no-store" };
}
