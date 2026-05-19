"use client";

import { QuestCard } from "@/components/quest-card";
import { FadeInItem, FadeInStagger } from "@/components/motion-preset";
import type { Quest, World } from "@/lib/schemas";

type Props = {
  quests: Quest[];
  worldNames: Record<string, string>;
  worlds?: Pick<World, "slug" | "name" | "presentation">[];
  schoolSlug?: string;
};

export function QuestGrid({ quests, worldNames, worlds, schoolSlug }: Props) {
  const worldBySlug = new Map((worlds ?? []).map((w) => [w.slug, w]));
  return (
    <FadeInStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {quests.map((q) => (
        <FadeInItem key={q.slug}>
          <QuestCard
            quest={q}
            worldName={worldNames[q.worldSlug] ?? q.worldSlug}
            world={worldBySlug.get(q.worldSlug)}
            schoolSlug={schoolSlug}
          />
        </FadeInItem>
      ))}
    </FadeInStagger>
  );
}
