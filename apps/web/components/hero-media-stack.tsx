import { cn } from "@/lib/utils";
import { getWorldVisual } from "@/lib/world-visuals";

type Props = {
  worldSlug: string;
  heroVideoUrl?: string;
  heroImageUrl?: string;
  /** iframe title for a11y */
  embedTitle: string;
  className?: string;
};

/**
 * Фон Hero: embed-видео (VK/YouTube), опционально постер под видео, иначе изображение или градиент мира.
 * При prefers-reduced-motion iframe скрывается через CSS — остаётся постер или градиент.
 */
export function HeroMediaStack({
  worldSlug,
  heroVideoUrl,
  heroImageUrl,
  embedTitle,
  className,
}: Props) {
  const v = getWorldVisual(worldSlug);
  const hasVideo = Boolean(heroVideoUrl?.trim());

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
      {heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- внешние CDN (VK и др.), список доменов не фиксирован
        <img
          src={heroImageUrl}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover opacity-85",
            hasVideo ? "brightness-[0.65]" : "opacity-90",
          )}
        />
      ) : null}

      {hasVideo ? (
        <iframe
          title={embedTitle}
          src={heroVideoUrl}
          className="marketing-hero__iframe absolute inset-0 size-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      ) : null}

      {!hasVideo && !heroImageUrl ? (
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
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent"
        />
      ) : null}
    </div>
  );
}
