import type { Metadata } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";

export function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
}

export function buildCanonicalPath(pathname: string): string {
  const origin = siteOrigin().replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return `${origin}${normalized}`;
}

type OgImageInput = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export function buildOpenGraph(params: {
  title: string;
  description: string;
  pathname: string;
  images?: OgImageInput[];
}): NonNullable<Metadata["openGraph"]> {
  const canonical = buildCanonicalPath(params.pathname);
  const images = params.images?.map((img) => ({
    url: img.url,
    alt: img.alt,
    width: img.width ?? 1200,
    height: img.height ?? 630,
  }));

  return {
    title: params.title,
    description: params.description,
    url: canonical,
    locale: "ru_RU",
    type: "website",
    siteName: "BrainMaster Quest Hub",
    ...(images?.length ? { images } : {}),
  };
}

export function buildTwitterCard(params: {
  title: string;
  description: string;
  imageUrl?: string;
}): NonNullable<Metadata["twitter"]> {
  return {
    card: params.imageUrl ? "summary_large_image" : "summary",
    title: params.title,
    description: params.description,
    ...(params.imageUrl ? { images: [params.imageUrl] } : {}),
  };
}

export function pageAlternates(pathname: string): Metadata["alternates"] {
  return {
    canonical: buildCanonicalPath(pathname),
  };
}

/** Absolute URL for OG/Twitter (relative `/public` paths → site origin). */
export function absolutePublicUrl(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl?.trim()) return undefined;
  const raw = pathOrUrl.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const origin = siteOrigin().replace(/\/$/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${origin}${path}`;
}
