import { publicS3BaseUrl } from "@/lib/data/public-snapshot-url";

export type HeroVideoInput = {
  heroVideoFileUrl?: string;
  heroVideoEmbedUrl?: string;
  /** @deprecated Use heroVideoEmbedUrl; embed iframe URL when set alone. */
  heroVideoUrl?: string;
};

export type ResolvedHeroVideo = {
  fileUrl?: string;
  embedUrl?: string;
};

const EMBED_HOST_RE =
  /(^|\.)((vk\.com)|(vkvideo\.ru)|(youtube\.com)|(youtu\.be)|(www\.youtube-nocookie\.com))$/i;

export function isVideoEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (EMBED_HOST_RE.test(u.hostname)) return true;
    return u.pathname.includes("video_ext");
  } catch {
    return false;
  }
}

export function isVideoFileUrl(url: string): boolean {
  const s = url.trim();
  if (/\.(mp4|webm)(\?|#|$)/i.test(s)) return true;
  if (s.startsWith("media/") && !s.includes("video_ext")) return true;
  return false;
}

/** Resolve `media/quests/...` or site-relative paths to public S3/CDN URL when configured. */
export function resolveHeroVideoFileUrl(pathOrUrl: string): string {
  const raw = pathOrUrl.trim();
  if (!raw) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const base = publicS3BaseUrl();
  if (!base) return raw.startsWith("/") ? raw : `/${raw}`;

  const path = raw.replace(/^\//, "");
  try {
    return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return raw;
  }
}

export function normalizeHeroVideo(input: HeroVideoInput): ResolvedHeroVideo {
  const legacy = input.heroVideoUrl?.trim();
  const fileExplicit = input.heroVideoFileUrl?.trim();
  const embedExplicit = input.heroVideoEmbedUrl?.trim();

  let fileUrl: string | undefined;
  if (fileExplicit) {
    fileUrl = resolveHeroVideoFileUrl(fileExplicit);
  } else if (legacy && isVideoFileUrl(legacy)) {
    fileUrl = resolveHeroVideoFileUrl(legacy);
  }

  let embedUrl: string | undefined;
  if (embedExplicit) {
    embedUrl = embedExplicit;
  } else if (legacy && isVideoEmbedUrl(legacy)) {
    embedUrl = legacy;
  } else if (legacy && !fileUrl) {
    embedUrl = legacy;
  }

  return { fileUrl, embedUrl };
}

export function hasHeroVideo(resolved: ResolvedHeroVideo): boolean {
  return Boolean(resolved.fileUrl || resolved.embedUrl);
}
