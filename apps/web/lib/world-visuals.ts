import type { LucideIcon } from "lucide-react";
import { Blocks, Cpu, Orbit, Waves } from "lucide-react";

/** Визуальные акценты карточек и hero по slug мира (worldSlug в квесте). */
export function getWorldVisual(worldSlug: string): {
  gradient: string;
  glow: string;
  Icon: LucideIcon;
  label: string;
} {
  switch (worldSlug) {
    case "cyber-rhythm":
      return {
        gradient:
          "from-fuchsia-500/35 via-violet-600/25 to-cyan-400/30 dark:from-fuchsia-500/25 dark:via-violet-950/60 dark:to-cyan-950/40",
        glow: "shadow-[0_0_60px_-12px] shadow-fuchsia-500/35",
        Icon: Waves,
        label: "Cyber Rhythm",
      };
    case "minecraft":
      return {
        gradient:
          "from-emerald-400/35 via-lime-500/20 to-teal-900/35 dark:from-emerald-500/20 dark:via-emerald-950/55 dark:to-lime-950/35",
        glow: "shadow-[0_0_50px_-14px] shadow-emerald-500/30",
        Icon: Blocks,
        label: "Minecraft",
      };
    case "mekhvarium":
      return {
        gradient:
          "from-amber-400/30 via-orange-600/25 to-rose-900/35 dark:from-amber-500/22 dark:via-orange-950/55 dark:to-amber-950/40",
        glow: "shadow-[0_0_55px_-12px] shadow-amber-500/35",
        Icon: Cpu,
        label: "Мехвариум",
      };
    default:
      return {
        gradient:
          "from-sky-400/25 via-indigo-600/20 to-violet-900/30 dark:from-sky-500/15 dark:via-indigo-950/50 dark:to-violet-950/45",
        glow: "shadow-[0_0_45px_-14px] shadow-indigo-500/25",
        Icon: Orbit,
        label: "Quest Hub",
      };
  }
}
