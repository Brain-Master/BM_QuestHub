import { publicS3BaseUrl } from "@/lib/data/public-snapshot-url";
import { shiftGroupIdToInboxDir } from "@/lib/media/shift-group-inbox-dir";

/** Legacy static paths before venue media moved to S3 (`public/venues/…` → `media/venues/…`). */
function legacyVenuePathToMedia(path: string): string | null {
  if (path.startsWith("/venues/")) return `media${path}`;
  return null;
}

/** Colon shift_group_id paths → `__` storage keys (Windows-safe media tree). */
function normalizeScheduleMediaPath(path: string): string {
  const m = path.match(/^(media\/schedule\/)([^/]+)(\/.*)?$/);
  if (!m) return path;
  const segment = m[2];
  if (!segment.includes(":")) return path;
  return `${m[1]}${shiftGroupIdToInboxDir(segment)}${m[3] ?? ""}`;
}

function resolveMediaPathOnS3(relativePath: string, base: string): string {
  try {
    return new URL(relativePath, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return `/${relativePath}`;
  }
}

/**
 * Resolve media paths for browser `<img>` / CSS `url()`.
 *
 * - `media/...` and legacy `/venues/...` — Object Storage via NEXT_PUBLIC_S3_PUBLIC_BASE_URL.
 * - Other `/...` — site-relative static export.
 * - `https://...` — unchanged.
 */
export function resolvePublicMediaUrl(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl?.trim()) return undefined;
  let raw = pathOrUrl.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  raw = normalizeScheduleMediaPath(raw);

  const base = publicS3BaseUrl();
  const legacyMedia = legacyVenuePathToMedia(raw);
  if (legacyMedia && base) {
    return resolveMediaPathOnS3(legacyMedia, base);
  }

  if (raw.startsWith("media/") && base) {
    return resolveMediaPathOnS3(raw, base);
  }

  if (raw.startsWith("/")) return raw;

  return `/${raw.replace(/^\//, "")}`;
}
