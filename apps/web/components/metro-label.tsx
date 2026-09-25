import siteConfig from "@/data/v2/site-config.json";

import type { PublicDictionaries } from "@/lib/data/v2/site-config";
import { cn } from "@/lib/utils";

export const METRO_LINES_BY_STATION: PublicDictionaries["metroLines"] =
  siteConfig.dictionaries.metroLines;

/** Choose the higher WCAG contrast against the official line colour. */
export function metroTextColor(color: string): "#000000" | "#ffffff" {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return "#000000";
  const rgb = [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#000000" : "#ffffff";
}

export function MetroLabel({ metro, className }: { metro?: string; className?: string }) {
  if (!metro || metro === "—") return null;

  const line =
    METRO_LINES_BY_STATION[metro as keyof typeof METRO_LINES_BY_STATION];

  return (
    <span className={cn("min-w-0", className)}>
      {line ? (
        <span
          aria-label={line.name}
          title={line.name}
          className={cn(
            "mr-1.5 inline-grid size-5 shrink-0 place-items-center rounded-full align-middle font-semibold text-[11px] leading-none tabular-nums",
          )}
          style={{ backgroundColor: line.color, color: metroTextColor(line.color) }}
        >
          {line.number}
        </span>
      ) : null}
      <span className="min-w-0">{metro}</span>
    </span>
  );
}
