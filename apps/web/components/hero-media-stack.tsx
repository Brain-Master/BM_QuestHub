"use client";

import { Play } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  hasHeroVideo,
  normalizeHeroVideo,
  type HeroVideoInput,
} from "@/lib/media/hero-video";
import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import { cn } from "@/lib/utils";
import { getWorldVisualBySlug } from "@/lib/world-visuals";

type Props = HeroVideoInput & {
  worldSlug: string;
  heroImageUrl?: string;
  /** iframe / video title for a11y */
  embedTitle: string;
  className?: string;
};

/**
 * Hero: poster first; MP4 (S3) or VK/YouTube embed loads only after Play.
 * prefers-reduced-motion: no autoplay media (see globals.css).
 */
export function HeroMediaStack({
  worldSlug,
  heroVideoFileUrl,
  heroVideoEmbedUrl,
  heroVideoUrl,
  heroImageUrl,
  embedTitle,
  className,
}: Props) {
  const v = getWorldVisualBySlug(worldSlug);
  const heroImageSrc = resolvePublicMediaUrl(heroImageUrl);
  const resolved = useMemo(
    () =>
      normalizeHeroVideo({
        heroVideoFileUrl,
        heroVideoEmbedUrl,
        heroVideoUrl,
      }),
    [heroVideoFileUrl, heroVideoEmbedUrl, heroVideoUrl],
  );
  const hasVideo = hasHeroVideo(resolved);
  const [playingFile, setPlayingFile] = useState(false);
  const [playingEmbed, setPlayingEmbed] = useState(false);

  const showFilePlayer = Boolean(resolved.fileUrl && playingFile);
  const showEmbed = Boolean(resolved.embedUrl && playingEmbed);
  const showPlayFile = Boolean(resolved.fileUrl && !playingFile);
  const showPlayEmbed = Boolean(resolved.embedUrl && !playingFile && !resolved.fileUrl);
  const showPlayEmbedSecondary = Boolean(
    resolved.embedUrl && resolved.fileUrl && !playingEmbed && !playingFile,
  );

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-t-2xl",
        hasVideo ? "aspect-video max-h-[min(70vh,520px)]" : "min-h-[200px] md:min-h-[240px]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-95 dark:opacity-100",
          v.gradient,
        )}
        aria-hidden
      />
      {heroImageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- external CDN URLs
        <img
          src={heroImageSrc}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover",
            showFilePlayer || showEmbed ? "opacity-40" : "opacity-90",
            hasVideo && !showFilePlayer && !showEmbed ? "brightness-[0.65]" : "",
          )}
        />
      ) : null}

      {showFilePlayer && resolved.fileUrl ? (
        <video
          className="marketing-hero__video absolute inset-0 size-full object-cover"
          src={resolved.fileUrl}
          poster={heroImageSrc}
          controls
          playsInline
          preload="metadata"
          aria-label={embedTitle}
        />
      ) : null}

      {showEmbed && resolved.embedUrl ? (
        <iframe
          title={embedTitle}
          src={resolved.embedUrl}
          className="marketing-hero__iframe absolute inset-0 size-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : null}

      {(showPlayFile || showPlayEmbed || showPlayEmbedSecondary) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/25 px-4">
          {showPlayFile ? (
            <Button
              type="button"
              size="lg"
              className="gap-2 shadow-lg"
              onClick={() => setPlayingFile(true)}
            >
              <Play className="size-5" aria-hidden />
              Смотреть видео
            </Button>
          ) : null}
          {showPlayEmbed ? (
            <Button
              type="button"
              size="lg"
              variant={showPlayFile ? "secondary" : "default"}
              className="gap-2 shadow-lg"
              onClick={() => setPlayingEmbed(true)}
            >
              <Play className="size-5" aria-hidden />
              Смотреть видео
            </Button>
          ) : null}
          {showPlayEmbedSecondary ? (
            <button
              type="button"
              className="text-sm text-white/90 underline-offset-4 hover:underline"
              onClick={() => setPlayingEmbed(true)}
            >
              Полная версия на VK
            </button>
          ) : null}
        </div>
      )}

      {!hasVideo && !heroImageSrc ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px",
          }}
        />
      ) : null}

      {hasVideo ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-24 bg-gradient-to-t from-black/55 to-transparent"
        />
      ) : null}
    </div>
  );
}
