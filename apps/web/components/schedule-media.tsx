import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import type { ScheduleMediaImage } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = {
  image: ScheduleMediaImage | null;
  title: string;
  mode: "detailed" | "compact";
  className?: string;
};

export function ScheduleMedia({ image, title, mode, className }: Props) {
  const focal = image?.focalPoint;
  const position = focal ? `${focal.x}% ${focal.y}%` : "50% 50%";
  const resolved = resolvePublicMediaUrl(image?.url);
  const imageUrl = resolved?.replace(/"/g, '\\"');

  return (
    <div
      data-testid="schedule-media"
      role={image ? "img" : undefined}
      aria-label={image?.alt ?? title}
      className={cn(
        "relative isolate overflow-hidden bg-gradient-to-br from-primary/25 via-card to-background",
        mode === "compact"
          ? "h-56 lg:h-auto lg:min-h-full lg:w-80"
          : "h-64 sm:h-80 md:h-[22rem]",
        className,
      )}
    >
      {image ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover/schedule-card:scale-[1.03]"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            backgroundPosition: position,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,color-mix(in_oklch,var(--primary)_32%,transparent),transparent_45%),linear-gradient(135deg,var(--card),var(--background))]" />
      )}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          mode === "compact"
            ? "bg-gradient-to-t from-[color:var(--schedule-card-bg)] via-[color:var(--schedule-card-bg)]/70 to-transparent lg:bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklch,var(--schedule-card-bg)_10%,transparent)_34%,color-mix(in_oklch,var(--schedule-card-bg)_48%,transparent)_58%,color-mix(in_oklch,var(--schedule-card-bg)_92%,transparent)_82%,var(--schedule-card-bg)_100%)]"
            : "bg-gradient-to-t from-[color:var(--schedule-card-bg)] via-[color:var(--schedule-card-bg)]/78 to-transparent",
        )}
      />
    </div>
  );
}
