import type { ScheduleCapacityView } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

type Props = {
  capacity: ScheduleCapacityView;
  archived?: boolean;
  compact?: boolean;
  className?: string;
};

export function ScheduleCapacityIndicator({
  capacity,
  archived = false,
  compact = false,
  className,
}: Props) {
  if (!capacity || archived) return null;

  return (
    <div
      data-testid="schedule-capacity"
      className={cn(
        "flex items-center gap-2 text-xs font-semibold tracking-wide",
        capacity.isSoldOut
          ? "text-[color:var(--schedule-capacity-full)]"
          : capacity.isLow
            ? "text-[color:var(--schedule-capacity-low)]"
            : "text-[color:var(--schedule-capacity-open)]",
        className,
      )}
    >
      <div
        className={cn(
          "hidden overflow-hidden rounded-full border border-white/10 bg-black/35 sm:block",
          compact ? "h-2 w-20" : "h-2.5 w-32",
        )}
        aria-hidden
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            capacity.isSoldOut
              ? "bg-[color:var(--schedule-capacity-full)]"
              : capacity.isLow
                ? "bg-[color:var(--schedule-capacity-low)]"
                : "bg-[color:var(--schedule-capacity-open)]",
          )}
          style={{ width: `${capacity.percent}%` }}
        />
      </div>
      <span>{capacity.label}</span>
    </div>
  );
}
