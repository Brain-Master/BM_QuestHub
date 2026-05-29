import type { ActivityGalleryPhoto, Venue } from "@/lib/schemas";
import { resolveHeroVideoFileUrl } from "@/lib/media/hero-video";
import {
  DEFAULT_SCHOOL_LANDING_SCOPE,
} from "@/lib/media/design-pack-slots";
import type { MediaIngestManifest } from "@/lib/media/manifest";
import { readMediaIngestManifest } from "@/lib/media/manifest";
import {
  resolveSchoolCampusLocations,
  type SchoolCampusLocation,
} from "@/lib/sites/campus-label";

export type { SchoolCampusLocation };

export type SchoolLandingMedia = {
  videoFileUrl?: string;
  videoPosterUrl?: string;
  activityGallery: ActivityGalleryPhoto[];
};

function galleryFromManifestScope(
  manifest: MediaIngestManifest,
  scope: string,
): ActivityGalleryPhoto[] {
  const prefix = `venue-activity:${scope}:`;
  return Object.entries(manifest.entries)
    .filter(([key]) => key.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, entry]) => ({
      url: entry.output,
      caption: entry.caption,
      alt: entry.caption,
    }));
}

function manifestOutput(
  manifest: MediaIngestManifest,
  key: string,
): string | undefined {
  return manifest.entries[key]?.output?.trim() || undefined;
}

function mergeActivityGallery(
  manifest: MediaIngestManifest,
  schoolScopeSlug: string,
): ActivityGalleryPhoto[] {
  const scopePhotos = galleryFromManifestScope(manifest, schoolScopeSlug);
  const defaultPhotos =
    schoolScopeSlug === DEFAULT_SCHOOL_LANDING_SCOPE
      ? []
      : galleryFromManifestScope(manifest, DEFAULT_SCHOOL_LANDING_SCOPE);

  if (scopePhotos.length > 0) {
    return [...scopePhotos, ...defaultPhotos];
  }
  return defaultPhotos;
}

function resolveLandingVideoUrl(
  manifest: MediaIngestManifest,
  schoolScopeSlug: string,
): string | undefined {
  const scopeVideo = manifestOutput(manifest, `venue-landing:${schoolScopeSlug}:video`);
  const defaultVideo = manifestOutput(
    manifest,
    `venue-landing:${DEFAULT_SCHOOL_LANDING_SCOPE}:video`,
  );
  const path = scopeVideo ?? defaultVideo;
  return path ? resolveHeroVideoFileUrl(path) : undefined;
}

function resolveLandingPosterUrl(
  manifest: MediaIngestManifest,
  schoolScopeSlug: string,
  activityGallery: ActivityGalleryPhoto[],
): string | undefined {
  const scopePoster = manifestOutput(manifest, `venue-landing:${schoolScopeSlug}:poster`);
  const defaultPoster = manifestOutput(
    manifest,
    `venue-landing:${DEFAULT_SCHOOL_LANDING_SCOPE}:poster`,
  );
  const path = scopePoster ?? defaultPoster ?? activityGallery[0]?.url;
  return path ? resolveHeroVideoFileUrl(path) : undefined;
}

/** Resolve school agenda landing video + gallery from media ingest manifest (not Cold Sheet). */
export function resolveSchoolLandingMedia(
  schoolScopeSlug: string,
  manifest?: MediaIngestManifest,
): SchoolLandingMedia {
  const resolvedManifest = manifest ?? readMediaIngestManifest(process.cwd());
  const activityGallery = mergeActivityGallery(resolvedManifest, schoolScopeSlug);

  return {
    videoFileUrl: resolveLandingVideoUrl(resolvedManifest, schoolScopeSlug),
    videoPosterUrl: resolveLandingPosterUrl(
      resolvedManifest,
      schoolScopeSlug,
      activityGallery,
    ),
    activityGallery,
  };
}

export function resolveSchoolLocationSummary(venues: readonly Venue[]): string {
  const locations = resolveSchoolCampusLocations(venues);
  if (locations.length === 0) return "";
  const includeHeadline = locations.length > 1;
  return locations
    .map((location) => formatCampusLocationLine(location, includeHeadline))
    .join("; ");
}

export { resolveSchoolCampusLocations };

function formatCampusLocationLine(
  location: SchoolCampusLocation,
  includeHeadline: boolean,
): string {
  const parts = [
    includeHeadline ? location.headline : undefined,
    location.metro ? `м. ${location.metro}` : undefined,
    location.district,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : location.headline;
}
