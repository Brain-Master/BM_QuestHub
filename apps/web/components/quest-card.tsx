import Link from "next/link";

import { ArrowUpRight, Key } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { difficultyToLevel } from "@/lib/quest-difficulty-level";
import type { Quest, World } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { getWorldVisual } from "@/lib/world-visuals";

type Props = {
  quest: Quest;
  worldName: string;
  world?: Pick<World, "slug" | "name" | "presentation">;
  schoolSlug?: string;
};

/** Убирает из durationLabel легаси-повторы формата («5 дней», «интенсив»), если строка ещё не обновлена в контенте. */
function normalizeDurationLabelForCatalog(
  raw: string,
  format: Quest["format"],
): string {
  let d = raw.trim();
  if (format !== "intensive" || !d) return d;

  d = d.replace(/^5\s*дней\s*[·•]\s*/i, "");

  if (/^интенсив\s*\(/i.test(d)) {
    d = d
      .replace(/^интенсив\s*\(\s*/i, "")
      .replace(/\)\s*$/u, "")
      .trim();
  }

  return d;
}

function buildMetaLine(quest: Quest): string {
  const formatLabel =
    quest.format === "intensive" ? "Интенсив 5 дней" : "Годовой трек";
  const parts: string[] = [formatLabel];

  const durationRaw = quest.durationLabel?.trim();
  if (durationRaw) {
    parts.push(normalizeDurationLabelForCatalog(durationRaw, quest.format));
  }

  const group = quest.groupSize?.trim();
  if (group && group.length <= 56) {
    parts.push(group);
  }

  parts.push(quest.ageLabel);
  return parts.join(" · ");
}

export function QuestCard({ quest, worldName, world, schoolSlug }: Props) {
  const v = getWorldVisual(
    world ?? { slug: quest.worldSlug, name: worldName },
  );
  const Icon = v.Icon;

  const href = schoolSlug
    ? `/quests/${quest.slug}?school=${encodeURIComponent(schoolSlug)}`
    : `/quests/${quest.slug}`;

  const previewLine = quest.catalogTagline ?? quest.tagline;
  const heroImg = quest.heroImageUrl?.trim();
  const metaLine = buildMetaLine(quest);
  const difficultyLevel = difficultyToLevel(quest.difficulty);
  const difficultyAnnouncement =
    quest.difficulty?.trim() ?? "средняя";

  return (
    <Card
      className={cn(
        "group flex h-full flex-col gap-0 overflow-hidden rounded-2xl border-white/10 bg-card/55 p-0 shadow-lg backdrop-blur-md transition",
        "hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl",
        v.glow,
      )}
    >
      <div
        className={cn(
          "relative aspect-[4/3] w-full shrink-0 overflow-hidden",
          !heroImg && `bg-gradient-to-br ${v.gradient}`,
        )}
      >
        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- внешние URL превью из контента
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon
              className="size-16 text-white/90 drop-shadow-md md:size-20"
              aria-hidden
            />
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)]"
        />
      </div>

      <CardHeader className="gap-3 px-6 pt-5 pb-2">
        <p className="break-words text-[11px] text-muted-foreground uppercase tracking-[0.18em] md:text-xs">
          {worldName}
        </p>
        <h3 className="font-heading break-words text-lg leading-snug font-semibold text-foreground line-clamp-3 md:text-xl">
          {quest.title}
        </h3>
        <p className="text-foreground/80 text-sm leading-snug line-clamp-3">
          {metaLine}
        </p>
        <CardDescription className="text-base leading-relaxed text-foreground/90 line-clamp-4">
          {previewLine}
        </CardDescription>
      </CardHeader>

      <div className="flex flex-1 flex-col gap-3 px-6 pb-2 text-sm">
        <div className="flex flex-wrap gap-2.5">
          {quest.skills.slice(0, 3).map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="border-white/10 bg-white/[0.03] font-normal text-foreground/90"
            >
              {s}
            </Badge>
          ))}
          {quest.skills.length > 3 ? (
            <Badge
              variant="outline"
              className="border-white/5 bg-transparent font-normal text-muted-foreground/80 opacity-80"
            >
              +{quest.skills.length - 3}
            </Badge>
          ) : null}
        </div>
      </div>

      <CardFooter className="mt-auto flex flex-row items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-6 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <Key
                key={i}
                className={cn(
                  "size-[1.15rem] shrink-0 md:size-5",
                  i < difficultyLevel
                    ? "text-foreground"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <span className="sr-only">Сложность: {difficultyAnnouncement}</span>
        </div>
        <Link
          href={href}
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "shrink-0 gap-1.5 rounded-lg",
          )}
        >
          Открыть досье
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </CardFooter>
    </Card>
  );
}
