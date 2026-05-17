"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import { BookingForm } from "@/components/booking-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveBookingAction } from "@/lib/booking";
import {
  trackBookingExternal,
  trackBookingFormOpen,
} from "@/lib/client-analytics";
import type {
  ScheduleBoardVariant,
  ScheduleBookingMode,
} from "@/lib/offers/schedule-board";
import type { Quest, Venue, VenueOffer } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = {
  quest: Pick<Quest, "slug" | "title">;
  offer: VenueOffer;
  venue: Venue;
  schoolSlug?: string;
  className?: string;
  buttonLabel?: string;
  showIncludedNote?: boolean;
  mode?: ScheduleBookingMode;
  variant?: Pick<ScheduleBoardVariant, "id" | "type" | "time" | "bookingMode">;
};

export function OfferBookingAction({
  quest,
  offer,
  venue,
  schoolSlug,
  className,
  buttonLabel = "Записаться",
  showIncludedNote = false,
  mode,
  variant,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const resolvedAction = resolveBookingAction(offer.mosBookingUrl);
  const action: ScheduleBookingMode =
    mode ??
    variant?.bookingMode ??
    (resolvedAction.kind === "mos"
      ? { kind: "mos", label: "mos.ru", url: resolvedAction.url }
      : { kind: "form", label: buttonLabel });
  const isWaitlistAction = action.kind === "waitlist";
  const buttonClassName = cn(
    "relative h-9 w-40 max-w-full overflow-hidden border-white/10 px-3 font-semibold text-xs shadow-lg transition-all duration-200 before:absolute before:inset-0 before:bg-white/20 before:opacity-0 before:transition-opacity hover:-translate-y-0.5 hover:before:opacity-100",
    action.kind === "form" &&
      "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-emerald-950/25 hover:from-emerald-300 hover:to-cyan-300",
    action.kind === "waitlist" &&
      "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 text-slate-950 shadow-sky-950/25 hover:from-cyan-300 hover:to-blue-300",
    action.kind === "mos" &&
      "bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 text-slate-950 shadow-[0_0_26px_rgba(251,146,60,0.38)] hover:from-amber-200 hover:via-orange-300 hover:to-rose-300",
    action.kind === "disabled" &&
      "border-slate-700 bg-slate-800 text-slate-300 shadow-none hover:translate-y-0",
  );

  function openForm() {
    setOpen(true);
    trackBookingFormOpen({
      questSlug: quest.slug,
      venueSlug: venue.slug,
      offerId: offer.id,
      schoolSlug,
    });
  }

  return (
    <div className={className}>
      {action.kind === "mos" ? (
        <a
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            buttonClassName,
          )}
          href={action.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackBookingExternal({
              questSlug: quest.slug,
              venueSlug: venue.slug,
              offerId: offer.id,
              schoolSlug,
            })
          }
        >
          <span className="relative z-10 inline-flex items-center gap-1.5">
            {action.label}
            <ExternalLink className="size-3.5" aria-hidden />
          </span>
        </a>
      ) : action.kind === "disabled" ? (
        <Button size="sm" className={buttonClassName} disabled>
          <span className="relative z-10">{action.label}</span>
        </Button>
      ) : (
        <Button size="sm" className={buttonClassName} onClick={openForm}>
          <span className="relative z-10">{action.label}</span>
        </Button>
      )}

      {showIncludedNote && offer.includedNote ? (
        <p className="mt-2 whitespace-pre-line text-muted-foreground text-xs">
          {offer.includedNote}
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isWaitlistAction ? "Заявка в лист ожидания" : "Заявка на программу"}
            </DialogTitle>
            <DialogDescription>
              {quest.title} · {venue.name} · {offer.shiftLabel}
              {variant ? ` · ${variant.type}` : null}
              {isWaitlistAction ? " · лист ожидания" : null}
            </DialogDescription>
          </DialogHeader>
          <BookingForm
            defaults={{
              leadType: isWaitlistAction ? "waitlist" : "booking",
              questSlug: quest.slug,
              questTitle: quest.title,
              offerId: offer.id,
              variantId: variant?.id,
              variantTitle: variant ? `${variant.type} · ${variant.time}` : undefined,
              venueSlug: venue.slug,
              venueName: venue.name,
              schoolSlug,
            }}
            submitLabel={
              isWaitlistAction ? "Отправить заявку в лист ожидания" : undefined
            }
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
