"use client";

import { QuestCard } from "@/components/quest-card";
import { FadeInItem, FadeInStagger } from "@/components/motion-preset";
import type { Quest } from "@/lib/schemas";

type Props = {
  quests: Quest[];
  worldNames: Record<string, string>;
  schoolSlug?: string;
};

export function QuestGrid({ quests, worldNames, schoolSlug }: Props) {
  return (
    <FadeInStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {quests.map((q) => (
        <FadeInItem key={q.slug}>
          <QuestCard
            quest={q}
            worldName={worldNames[q.worldSlug] ?? q.worldSlug}
            schoolSlug={schoolSlug}
          />
        </FadeInItem>
      ))}
    </FadeInStagger>
  );
}
