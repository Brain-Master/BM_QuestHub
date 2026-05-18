"use client";

import * as React from "react";

import { BookingForm } from "@/components/booking-form";
import { MosBookingSuccess } from "@/components/mos-booking-success";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  trackBookingExternal,
  trackBookingFormOpen,
} from "@/lib/client-analytics";
import type {
  ScheduleBoardVariant,
  ScheduleBookingMode,
} from "@/lib/offers/schedule-board";
import { resolveRegistrationFlow } from "@/lib/registration-flow";
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
  compact?: boolean;
  mode?: ScheduleBookingMode;
  variant?: Pick<
    ScheduleBoardVariant,
    | "id"
    | "type"
    | "time"
    | "priceLabel"
    | "registrationChannel"
    | "allowPreliminaryRegistration"
    | "bookingMode"
  >;
};

export function OfferBookingAction({
  quest,
  offer,
  venue,
  schoolSlug,
  className,
  buttonLabel = "Записаться",
  showIncludedNote = false,
  compact = false,
  mode,
  variant,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<"form" | "mos_success">("form");
  const action: ScheduleBookingMode =
    mode ?? variant?.bookingMode ?? { kind: "form", label: buttonLabel };
  const registrationChannel =
    variant?.registrationChannel ?? offer.scheduleCard?.registrationChannel ?? "brainmaster";
  const flowContext = resolveRegistrationFlow({
    bookingMode: action,
    registrationChannel,
  });
  const buttonClassName = cn(
    "relative max-w-full overflow-hidden border-white/10 font-semibold text-xs shadow-lg transition-all duration-200 before:absolute before:inset-0 before:bg-white/20 before:opacity-0 before:transition-opacity hover:-translate-y-0.5 hover:before:opacity-100",
    compact ? "h-8 w-full px-3 sm:w-44" : "h-9 w-48 px-3",
    action.kind === "form" &&
      "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-emerald-950/25 hover:from-emerald-300 hover:to-cyan-300",
    action.kind === "waitlist" &&
      "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 text-slate-950 shadow-sky-950/25 hover:from-cyan-300 hover:to-blue-300",
    action.kind === "mos" &&
      "bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 text-slate-950 shadow-[0_0_26px_rgba(251,146,60,0.38)] hover:from-amber-200 hover:via-orange-300 hover:to-rose-300",
    action.kind === "disabled" &&
      "border-slate-700 bg-slate-800 text-slate-300 shadow-none hover:translate-y-0",
  );

  const formatLabel = variant
    ? `${variant.type} (${variant.time})`
    : offer.daySchedule;

  const priceLabel = variant?.priceLabel ?? offer.priceLabel;

  function openForm() {
    setView("form");
    setOpen(true);
    trackBookingFormOpen({
      questSlug: quest.slug,
      venueSlug: venue.slug,
      offerId: offer.id,
      schoolSlug,
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setView("form");
    }
  }

  function trackMosOpen() {
    if (action.kind !== "mos") return;
    trackBookingExternal({
      questSlug: quest.slug,
      venueSlug: venue.slug,
      offerId: offer.id,
      schoolSlug,
    });
  }

  return (
    <div className={className}>
      {action.kind === "disabled" ? (
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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            "gap-0 border-slate-800 bg-[#0F172A] p-0 text-slate-100 shadow-2xl shadow-black/50 sm:max-w-[410px]",
            "[&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3",
            "[&_[data-slot=dialog-close]]:text-slate-400 [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white",
          )}
        >
          <DialogHeader className="border-slate-800 border-b px-5 py-4 pr-12">
            <DialogTitle className="font-heading text-lg text-white">
              {view === "mos_success" ? "Спасибо за заявку" : flowContext.title}
            </DialogTitle>
          </DialogHeader>
          {view === "mos_success" && action.kind === "mos" ? (
            <MosBookingSuccess mosUrl={action.url} onOpenMos={trackMosOpen} />
          ) : (
          <div className="px-5 py-4">
            <BookingForm
              summary={{
                venueName: venue.name,
                questTitle: quest.title,
                dates: offer.dateRange,
                format: formatLabel,
                priceLabel,
              }}
              defaults={{
                leadType: flowContext.leadType,
                registrationChannel: flowContext.registrationChannel,
                questSlug: quest.slug,
                questTitle: quest.title,
                offerId: offer.id,
                variantId: variant?.id,
                variantTitle: variant ? `${variant.type} · ${variant.time}` : undefined,
                venueSlug: venue.slug,
                venueName: venue.name,
                schoolSlug,
              }}
              flowContext={flowContext}
              onSuccess={() => {
                if (action.kind === "mos") {
                  setView("mos_success");
                  return;
                }
                setOpen(false);
              }}
            />
          </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
