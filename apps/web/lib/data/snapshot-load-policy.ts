/**
 * Policy for loading public cold snapshots from S3 during build.
 */

export function isRemoteCatalogSnapshotSource(): boolean {
  if (process.env.CATALOG_SNAPSHOT_SOURCE === "local") return false;
  if (process.env.CATALOG_SNAPSHOT_SOURCE === "s3") return true;
  return process.env.SITE_SNAPSHOT_SOURCE === "s3";
}

/** Fail build instead of falling back to committed JSON when remote cold load fails. */
export function isStrictRemoteCatalogLoad(): boolean {
  return (
    process.env.SITE_SNAPSHOT_STRICT === "1" && isRemoteCatalogSnapshotSource()
  );
}

/** Emergency only: allow stale local JSON when S3 is unreachable (default off). */
export function allowLocalSnapshotFallback(): boolean {
  return process.env.SITE_SNAPSHOT_ALLOW_LOCAL_FALLBACK === "1";
}

/** HTTP auth/not-found errors must not silently fall back to git snapshots. */
export function isNonRetriableFetchError(message: string): boolean {
  return /HTTP (401|403|404)\b/.test(message);
}

export function isRetriableFetchError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  if (isNonRetriableFetchError(message)) return false;

  const cause = err instanceof Error ? err.cause : undefined;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: string }).code)
      : err instanceof Error && "code" in err
        ? String((err as Error & { code?: string }).code)
        : "";

  if (
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "EAI_AGAIN"
  ) {
    return true;
  }
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.name === "TimeoutError") return true;
  }
  return /fetch failed/i.test(message);
}

export function strictSnapshotLoadError(
  label: string,
  remoteUrl: string,
  cause: unknown,
): Error {
  const detail =
    cause instanceof Error ? cause.message : String(cause ?? "unknown");
  return new Error(
    `[catalog-loader] strict: failed to load ${label} from ${remoteUrl}: ${detail}`,
  );
}
