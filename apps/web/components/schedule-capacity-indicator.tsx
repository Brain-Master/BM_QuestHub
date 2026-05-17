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
        "inline-flex items-center gap-2.5 rounded-full border bg-black/22 px-2.5 py-1.5 font-bold text-[0.78rem] tracking-wide whitespace-nowrap shadow-[0_0_20px_color-mix(in_oklch,currentColor_14%,transparent)] backdrop-blur-md",
        capacity.isSoldOut
          ? "border-[color:var(--schedule-capacity-full)]/35 text-[color:var(--schedule-capacity-full)]"
          : capacity.isLow
            ? "border-[color:var(--schedule-capacity-low)]/35 text-[color:var(--schedule-capacity-low)]"
            : "border-[color:var(--schedule-capacity-open)]/30 text-[color:var(--schedule-capacity-open)]",
        className,
      )}
    >
      <div
        className={cn(
          "hidden overflow-hidden rounded-full border border-white/15 bg-white/12 sm:block",
          compact ? "h-2.5 w-24" : "h-3 w-36",
        )}
        aria-hidden
      >
        <div
          className={cn(
            "h-full min-w-1 rounded-full transition-[width] duration-300 shadow-[0_0_10px_currentColor]",
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
