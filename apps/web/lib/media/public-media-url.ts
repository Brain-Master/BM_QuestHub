import { publicS3BaseUrl } from "@/lib/data/public-snapshot-url";

/**
 * Resolve media paths for browser `<img>` / CSS `url()`.
 *
 * - `/venues/...` — static export (`public/`), keep site-relative.
 * - `media/...` — Object Storage; prefix with NEXT_PUBLIC_S3_PUBLIC_BASE_URL.
 * - `https://...` — unchanged.
 */
export function resolvePublicMediaUrl(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl?.trim()) return undefined;
  const raw = pathOrUrl.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;

  const base = publicS3BaseUrl();
  if (raw.startsWith("media/") && base) {
    try {
      return new URL(raw, base.endsWith("/") ? base : `${base}/`).toString();
    } catch {
      return `/${raw}`;
    }
  }

  return `/${raw.replace(/^\//, "")}`;
}
