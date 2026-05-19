/**
 * Fetch options for public snapshot URLs during Next static export.
 * `cache: "no-store"` forces dynamic rendering and breaks `output: "export"`.
 */
export function snapshotFetchInit(): RequestInit {
  return process.env.NODE_ENV === "production"
    ? { cache: "force-cache" }
    : { cache: "no-store" };
}
