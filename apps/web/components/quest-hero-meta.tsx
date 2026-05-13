import { Badge } from "@/components/ui/badge";
import type { Quest } from "@/lib/schemas";
import { durationLabelOrDefault, priceHintOrDefault } from "@/lib/quest-hero-defaults";

type Props = {
  quest: Quest;
  schoolSlug?: string;
};

export function QuestHeroMeta({ quest, schoolSlug }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge className="border-white/10 bg-white/5 font-normal">
          {quest.format === "intensive"
            ? "Интенсив 5 дней"
            : "Годовой трек"}
        </Badge>
        {quest.difficulty ? (
          <Badge variant="outline" className="border-white/10 bg-transparent">
            Сложность: {quest.difficulty}
          </Badge>
        ) : null}
        {schoolSlug ? (
          <Badge variant="outline" className="border-white/10 bg-transparent">
            school={schoolSlug}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-card/45 p-5 text-sm shadow-inner backdrop-blur-md md:grid-cols-2 md:p-6">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Возраст:</span>{" "}
          {quest.ageLabel}
        </p>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Формат и срок:</span>{" "}
          {durationLabelOrDefault(quest)}
        </p>
        {quest.groupSize ? (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Группа:</span>{" "}
            {quest.groupSize}
          </p>
        ) : null}
        <p className="text-muted-foreground md:col-span-2">
          <span className="font-medium text-foreground">Цена:</span>{" "}
          {priceHintOrDefault(quest)}
        </p>
        <p className="text-muted-foreground md:col-span-2">
          <span className="font-medium text-foreground">Навыки:</span>{" "}
          {quest.skills.join(", ")}
        </p>
      </div>
    </div>
  );
}
