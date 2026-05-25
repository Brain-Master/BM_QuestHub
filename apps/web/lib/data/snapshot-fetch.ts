/**
 * Fetch options for public snapshot URLs during Next static export.
 * `cache: "no-store"` forces dynamic rendering and breaks `output: "export"`;
 * production build uses `force-cache` so parallel SSG workers can prerender with S3 data.
 */
export function snapshotFetchInit(): RequestInit {
  if (process.env.SITE_SNAPSHOT_SOURCE === "s3") {
    return process.env.NODE_ENV === "production"
      ? { cache: "force-cache" }
      : { cache: "no-store" };
  }
  return process.env.NODE_ENV === "production"
    ? { cache: "force-cache" }
    : { cache: "no-store" };
}
