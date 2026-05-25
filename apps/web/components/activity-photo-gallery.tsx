"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ActivityGalleryPhoto } from "@/lib/schemas";
import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import { cn } from "@/lib/utils";

type Props = {
  photos: ActivityGalleryPhoto[];
  schoolName: string;
  className?: string;
};

export function ActivityPhotoGallery({ photos, schoolName, className }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const lightboxPanelRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const resolved = photos
    .map((photo) => {
      const src = resolvePublicMediaUrl(photo.url);
      if (!src) return null;
      return {
        ...photo,
        src,
        alt: photo.alt ?? `Занятия BrainMaster · ${schoolName}`,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const scrollStrip = useCallback((direction: -1 | 1) => {
    const el = stripRef.current;
    if (!el) return;
    const step = Math.max(240, el.clientWidth * 0.75);
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  const goLightbox = useCallback(
    (delta: -1 | 1) => {
      setLightboxIndex((current) => {
        if (current === null || resolved.length === 0) return current;
        const next = (current + delta + resolved.length) % resolved.length;
        return next;
      });
    },
    [resolved.length],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const frame = requestAnimationFrame(() => {
      lightboxPanelRef.current?.focus();
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        goLightbox(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        goLightbox(1);
      }
    };
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [lightboxIndex, goLightbox]);

  if (resolved.length === 0) return null;

  const active = lightboxIndex !== null ? resolved[lightboxIndex] : null;

  return (
    <section
      className={cn("space-y-4", className)}
      aria-labelledby="activity-gallery-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="activity-gallery-heading"
            className="font-heading text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Как проходят наши занятия
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Яркие моменты смен BrainMaster · {schoolName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Предыдущие фото"
            onClick={() => scrollStrip(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Следующие фото"
            onClick={() => scrollStrip(1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div
        ref={stripRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]"
        role="region"
        aria-label="Фото с занятий"
      >
        {resolved.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            className="group relative h-48 w-64 shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-black/20 sm:h-52 sm:w-72"
            onClick={() => setLightboxIndex(index)}
            aria-label={`Открыть фото ${index + 1} из ${resolved.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.alt}
              className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      >
        <DialogContent
          className="w-[min(96vw,72rem)] max-w-[min(96vw,72rem)] border-white/10 bg-zinc-950/95 p-0 sm:max-w-[min(96vw,72rem)]"
          showCloseButton
        >
          <DialogTitle className="sr-only">
            {active?.alt ?? "Фото с занятий"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {lightboxIndex !== null
              ? `Фото ${lightboxIndex + 1} из ${resolved.length}. Стрелки влево и вправо на клавиатуре.`
              : ""}
          </DialogDescription>

          {active ? (
            <div
              ref={lightboxPanelRef}
              tabIndex={-1}
              className="relative outline-none"
            >
              <div className="relative flex min-h-[min(50vh,400px)] items-center justify-center px-2 py-2 sm:px-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.src}
                  alt={active.alt}
                  className="mx-auto max-h-[min(90vh,900px)] w-auto max-w-full object-contain"
                />
              </div>

              {active.caption ? (
                <p className="border-t border-white/10 px-4 py-3 text-center text-muted-foreground text-sm">
                  {active.caption}
                </p>
              ) : null}

              {resolved.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 left-2 z-10 -translate-y-1/2"
                    aria-label="Предыдущее фото"
                    onClick={() => goLightbox(-1)}
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 right-2 z-10 -translate-y-1/2"
                    aria-label="Следующее фото"
                    onClick={() => goLightbox(1)}
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
