import { ScheduleBoardCardCompact } from "@/components/schedule-board-card-compact";
import { ScheduleBoardCardDetailed } from "@/components/schedule-board-card-detailed";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";

export type ScheduleViewMode = "detailed" | "compact";

type Props = {
  item: ScheduleBoardItem;
  mode: ScheduleViewMode;
  schoolSlug?: string;
  expanded?: boolean;
  highlighted?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  onNavigate?: () => void;
};

export function ScheduleBoardCard({
  item,
  mode,
  schoolSlug,
  expanded = false,
  highlighted = false,
  onExpandChange,
  onNavigate,
}: Props) {
  if (mode === "compact") {
    return (
      <ScheduleBoardCardCompact
        item={item}
        schoolSlug={schoolSlug}
        expanded={expanded}
        highlighted={highlighted}
        onExpandChange={onExpandChange}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <ScheduleBoardCardDetailed
      item={item}
      schoolSlug={schoolSlug}
      highlighted={highlighted}
      onNavigate={onNavigate}
    />
  );
}
