import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  item: Pick<ScheduleBoardItem, "displayTitle" | "programNameH1" | "programNameH2">;
  headingClassName?: string;
  overlineClassName?: string;
  as?: "h2" | "h3";
};

export function ScheduleCardTitle({
  item,
  headingClassName,
  overlineClassName,
  as: Heading = "h3",
}: Props) {
  if (item.programNameH2) {
    return (
      <div className="grid gap-1">
        {item.programNameH1 ? (
          <p
            className={cn(
              "font-medium text-muted-foreground text-xs uppercase tracking-[0.14em] sm:text-sm",
              overlineClassName,
            )}
          >
            {item.programNameH1}
          </p>
        ) : null}
        <Heading className={headingClassName}>{item.programNameH2}</Heading>
      </div>
    );
  }

  return <Heading className={headingClassName}>{item.displayTitle}</Heading>;
}
