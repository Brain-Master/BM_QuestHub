import { Badge } from "@/components/ui/badge";
import type { ScheduleDisplayStatus } from "@/lib/offers/schedule-board";
import { isScheduleDisplayStatusLive } from "@/lib/offers/schedule-dictionaries";
import type { ScheduleStatusVariant } from "@/lib/offers/schedule-dictionaries";
import { cn } from "@/lib/utils";

const variantClass: Record<ScheduleStatusVariant, string> = {
  success:
    "border-[color:var(--schedule-status-success-border)] bg-[color:var(--schedule-status-success-bg)] text-[color:var(--schedule-status-success-fg)]",
  info:
    "border-[color:var(--schedule-status-info-border)] bg-[color:var(--schedule-status-info-bg)] text-[color:var(--schedule-status-info-fg)]",
  purple:
    "border-[color:var(--schedule-status-purple-border)] bg-[color:var(--schedule-status-purple-bg)] text-[color:var(--schedule-status-purple-fg)]",
  warning:
    "border-[color:var(--schedule-status-warning-border)] bg-[color:var(--schedule-status-warning-bg)] text-[color:var(--schedule-status-warning-fg)]",
  default:
    "border-[color:var(--schedule-status-default-border)] bg-[color:var(--schedule-status-default-bg)] text-[color:var(--schedule-status-default-fg)]",
  destructive:
    "border-[color:var(--schedule-status-destructive-border)] bg-[color:var(--schedule-status-destructive-bg)] text-[color:var(--schedule-status-destructive-fg)]",
};

type Props = {
  label: ScheduleDisplayStatus;
  variant: ScheduleStatusVariant;
  className?: string;
};

export function ScheduleStatusBadge({ label, variant, className }: Props) {
  const isLive = isScheduleDisplayStatusLive(label);

  return (
    <Badge
      variant="outline"
      data-testid="schedule-status"
      className={cn(
        "h-7 border px-3 font-semibold text-xs shadow-[0_0_20px_color-mix(in_oklch,currentColor_18%,transparent),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/10 backdrop-blur-md",
        variantClass[variant],
        className,
      )}
    >
      {isLive ? (
        <span
          aria-hidden
          className="size-1.5 animate-pulse rounded-full bg-current shadow-[0_0_8px_currentColor]"
        />
      ) : null}
      {label}
    </Badge>
  );
}
