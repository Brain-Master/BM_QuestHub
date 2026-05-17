"use client";

import * as React from "react";

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
};

export function OfferBookingAction({
  quest,
  offer,
  venue,
  schoolSlug,
  className,
  buttonLabel = "Записаться",
  showIncludedNote = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const action = resolveBookingAction(offer.mosBookingUrl);

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
            "border-white/15 bg-white/5 hover:bg-white/10",
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
          mos.ru
        </a>
      ) : (
        <Button size="sm" onClick={openForm}>
          {buttonLabel}
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
            <DialogTitle>Заявка на программу</DialogTitle>
            <DialogDescription>
              {quest.title} · {venue.name} · {offer.shiftLabel}
            </DialogDescription>
          </DialogHeader>
          <BookingForm
            defaults={{
              questSlug: quest.slug,
              questTitle: quest.title,
              offerId: offer.id,
              venueSlug: venue.slug,
              venueName: venue.name,
              schoolSlug,
            }}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
