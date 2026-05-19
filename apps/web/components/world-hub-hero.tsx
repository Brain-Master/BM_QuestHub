import type { World } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { getWorldVisual } from "@/lib/world-visuals";

import { HeroMediaStack } from "@/components/hero-media-stack";

type Props = {
  world: World;
};

export function WorldHubHero({ world }: Props) {
  const v = getWorldVisual(world);
  const Icon = v.Icon;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_80px_-24px_rgba(139,92,246,0.35)]",
        v.glow,
      )}
    >
      <HeroMediaStack
        worldSlug={world.slug}
        heroVideoUrl={world.heroVideoUrl}
        heroImageUrl={world.heroImageUrl}
        embedTitle={`Видео о мире «${world.name}»`}
      />

      <div className="relative flex flex-col gap-4 border-white/10 border-t bg-black/40 px-6 py-8 backdrop-blur-md md:flex-row md:items-start md:gap-6 md:px-10 md:py-9">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/30 text-white shadow-inner md:size-16">
          <Icon className="size-7 md:size-8" aria-hidden />
        </div>
        <div className="min-w-0 space-y-3">
          <p className="text-[11px] text-white/75 uppercase tracking-[0.28em] md:text-xs">
            Мир · {world.name}
          </p>
          <h1 className="font-heading max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
            {world.name}
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-zinc-200 md:text-lg">
            {world.tagline}
          </p>
        </div>
      </div>
    </div>
  );
}
