import siteConfig from "@/data/v2/site-config.json";

import type { PublicDictionaries } from "@/lib/data/v2/site-config";
import { cn } from "@/lib/utils";

export const METRO_LINES_BY_STATION: PublicDictionaries["metroLines"] =
  siteConfig.dictionaries.metroLines;

export function MetroLabel({ metro, className }: { metro?: string; className?: string }) {
  if (!metro || metro === "—") return null;

  const line =
    METRO_LINES_BY_STATION[metro as keyof typeof METRO_LINES_BY_STATION];

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {line ? (
        <span
          aria-label={line.name}
          title={line.name}
          className={cn(
            "inline-grid size-4 shrink-0 place-items-center rounded-full font-semibold text-[9px] text-white leading-none tabular-nums",
            line.number.length > 1 && "text-[8px]",
          )}
          style={{ backgroundColor: line.color }}
        >
          {line.number}
        </span>
      ) : null}
      <span className="min-w-0">{metro}</span>
    </span>
  );
}
