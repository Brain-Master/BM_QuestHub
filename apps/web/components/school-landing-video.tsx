"use client";

import { useEffect, useRef, useState } from "react";

import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import { cn } from "@/lib/utils";

type Props = {
  videoFileUrl?: string;
  posterUrl?: string;
  title: string;
  className?: string;
};

/**
 * Self-hosted MP4 landing clip: autoplay muted loop for cold ad traffic.
 * prefers-reduced-motion → poster only + optional manual play.
 */
export function SchoolLandingVideo({
  videoFileUrl,
  posterUrl,
  title,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [manualPlay, setManualPlay] = useState(false);

  const resolvedVideo = videoFileUrl?.trim();
  const resolvedPoster = resolvePublicMediaUrl(posterUrl);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !resolvedVideo || reducedMotion || !manualPlay) return;
    void el.play().catch(() => undefined);
  }, [resolvedVideo, reducedMotion, manualPlay]);

  if (!resolvedVideo && !resolvedPoster) return null;

  const showAutoplay = Boolean(resolvedVideo) && !reducedMotion;
  const showManualPlay = Boolean(resolvedVideo) && reducedMotion && !manualPlay;

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg",
        className,
      )}
    >
      {resolvedPoster ? (
        // eslint-disable-next-line @next/next/no-img-element -- CDN / public paths
        <img
          src={resolvedPoster}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover",
            showAutoplay ? "opacity-0" : "opacity-100",
          )}
          fetchPriority="high"
        />
      ) : null}

      {resolvedVideo && (showAutoplay || manualPlay) ? (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          src={resolvedVideo}
          poster={resolvedPoster}
          autoPlay={showAutoplay}
          muted
          loop
          playsInline
          preload={showAutoplay ? "auto" : "metadata"}
          aria-label={title}
        />
      ) : null}

      {showManualPlay ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <button
            type="button"
            className="rounded-full border border-white/20 bg-black/50 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setManualPlay(true)}
          >
            Смотреть видео
          </button>
        </div>
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent"
      />
    </div>
  );
}
