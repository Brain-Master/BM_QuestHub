import type { Quest, World } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { getWorldVisual } from "@/lib/world-visuals";

import { HeroMediaStack } from "@/components/hero-media-stack";

type Props = {
  quest: Quest;
  world: World | undefined;
};

export function QuestHeroBanner({ quest, world }: Props) {
  const v = world
    ? getWorldVisual(world)
    : getWorldVisual({ slug: quest.worldSlug, name: quest.worldSlug });
  const Icon = v.Icon;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 shadow-lg",
        v.glow,
      )}
    >
      <HeroMediaStack
        worldSlug={quest.worldSlug}
        heroVideoFileUrl={quest.heroVideoFileUrl}
        heroVideoEmbedUrl={quest.heroVideoEmbedUrl}
        heroVideoUrl={quest.heroVideoUrl}
        heroImageUrl={quest.heroImageUrl}
        embedTitle={`Видео: ${quest.title}`}
      />

      <div className="relative flex flex-col gap-5 border-white/10 border-t bg-black/35 px-4 py-5 backdrop-blur-md sm:px-6 md:flex-row md:items-start md:justify-between md:px-8 md:py-7">
        <div className="flex min-w-0 gap-3 sm:gap-4 md:gap-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/25 text-white shadow-inner sm:size-14 md:size-16">
            <Icon className="size-6 sm:size-7 md:size-8" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] text-white/75 uppercase tracking-[0.2em] md:text-xs">
              {world?.name ?? v.label}
            </p>
            <h1 className="font-heading text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
              {quest.title}
            </h1>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-white/90 md:text-base">
              {quest.tagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
