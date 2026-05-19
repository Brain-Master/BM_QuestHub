import type { LucideIcon } from "lucide-react";
import { Blocks, Cpu, Orbit, Waves } from "lucide-react";

import type { World } from "@/lib/schemas";

const ICONS: Record<string, LucideIcon> = {
  blocks: Blocks,
  cpu: Cpu,
  waves: Waves,
  orbit: Orbit,
};

const DEFAULT_VISUAL = {
  gradient:
    "from-sky-400/25 via-indigo-600/20 to-violet-900/30 dark:from-sky-500/15 dark:via-indigo-950/50 dark:to-violet-950/45",
  glow: "shadow-[0_0_45px_-14px] shadow-indigo-500/25",
  Icon: Orbit,
  label: "Quest Hub",
};

/** Card / hero accents from world YAML `presentation` or safe defaults. */
export function getWorldVisual(world: Pick<World, "slug" | "name" | "presentation">): {
  gradient: string;
  glow: string;
  Icon: LucideIcon;
  label: string;
} {
  const p = world.presentation;
  if (p) {
    return {
      gradient: p.cardGradient,
      glow: p.cardGlow,
      Icon: ICONS[p.iconKey] ?? DEFAULT_VISUAL.Icon,
      label: p.cardLabel ?? world.name,
    };
  }
  return { ...DEFAULT_VISUAL, label: world.name };
}

/** @deprecated Prefer `getWorldVisual(world)` with loaded YAML. */
export function getWorldVisualBySlug(worldSlug: string, worldName?: string): {
  gradient: string;
  glow: string;
  Icon: LucideIcon;
  label: string;
} {
  return getWorldVisual({
    slug: worldSlug,
    name: worldName ?? worldSlug,
    presentation: undefined,
  });
}
