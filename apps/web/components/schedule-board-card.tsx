import { ScheduleBoardCardCompact } from "@/components/schedule-board-card-compact";
import { ScheduleBoardCardDetailed } from "@/components/schedule-board-card-detailed";
import { ScheduleBoardCardMobile } from "@/components/schedule-board-card-mobile";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";

export type ScheduleViewMode = "detailed" | "compact";
export type ScheduleCardMode = ScheduleViewMode | "mobile";

type Props = {
  item: ScheduleBoardItem;
  mode: ScheduleCardMode;
  schoolSlug?: string;
  bookingSchoolSlug?: string;
  expanded?: boolean;
  highlighted?: boolean;
  onExpandChange?: (expanded: boolean, anchor: HTMLElement | null) => void;
  onNavigate?: () => void;
};

export function ScheduleBoardCard({
  item,
  mode,
  schoolSlug,
  bookingSchoolSlug,
  expanded = false,
  highlighted = false,
  onExpandChange,
  onNavigate,
}: Props) {
  if (mode === "mobile") {
    return (
      <ScheduleBoardCardMobile
        item={item}
        schoolSlug={schoolSlug}
        bookingSchoolSlug={bookingSchoolSlug}
        expanded={expanded}
        highlighted={highlighted}
        onExpandChange={onExpandChange}
        onNavigate={onNavigate}
      />
    );
  }

  if (mode === "compact") {
    return (
      <ScheduleBoardCardCompact
        item={item}
        schoolSlug={schoolSlug}
        bookingSchoolSlug={bookingSchoolSlug}
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
      schoolSlug={bookingSchoolSlug ?? schoolSlug}
      highlighted={highlighted}
      onNavigate={onNavigate}
    />
  );
}
