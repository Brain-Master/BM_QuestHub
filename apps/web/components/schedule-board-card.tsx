import { ScheduleBoardCardCompact } from "@/components/schedule-board-card-compact";
import { ScheduleBoardCardDetailed } from "@/components/schedule-board-card-detailed";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";

export type ScheduleViewMode = "detailed" | "compact";

type Props = {
  item: ScheduleBoardItem;
  mode: ScheduleViewMode;
  schoolSlug?: string;
};

export function ScheduleBoardCard({ item, mode, schoolSlug }: Props) {
  if (mode === "compact") {
    return <ScheduleBoardCardCompact item={item} schoolSlug={schoolSlug} />;
  }

  return <ScheduleBoardCardDetailed item={item} schoolSlug={schoolSlug} />;
}
