"use client";

import * as React from "react";

import { BookingForm } from "@/components/booking-form";
import { LeadFormSuccess } from "@/components/lead-form-success";
import { MosBookingSuccess } from "@/components/mos-booking-success";
import { MosBookingCountdown, type MosCountdownHandle } from "@/components/mos-booking-countdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { MOS_BOOKING_COPY } from "@/content/mos-booking-copy";
import { notifyMosBookingClick } from "@/lib/mos-booking-click";
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
import { resolveVenueShortName } from "@/lib/sites/venue-label";
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

export function OfferBookingAction(props: Props) {
  const action = props.mode ?? props.variant?.bookingMode;
  const target = [props.quest.slug, props.offer.id, props.venue.slug, props.variant?.id,
    action?.kind, action?.kind === "mos" ? action.url : ""].join("|");
  // A live target/availability change must not inherit another card's timer/form.
  return <OfferBookingActionContent key={target} {...props} />;
}

function OfferBookingActionContent({
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
  const [session, setSession] = React.useState(0);
  const [view, setView] = React.useState<"mos_intro" | "form" | "mos_success" | "lead_success">(
    "form",
  );
  const triggerRef = React.useRef<HTMLElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const countdownRef = React.useRef<MosCountdownHandle>(null);
  const formSession = React.useRef(0);
  React.useEffect(() => {
    if (open && view !== "form") titleRef.current?.focus();
  }, [open, view]);
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

  function openForm(trigger?: HTMLElement) {
    if (trigger) triggerRef.current = trigger;
    countdownRef.current?.stop();
    if (open) titleRef.current?.focus();
    setView("form");
    formSession.current += 1;
    setSession(formSession.current);
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
      countdownRef.current?.stop();
      setView("form");
      formSession.current += 1;
      setSession(formSession.current);
    }
  }

  function trackMosOpen() {
    if (action.kind !== "mos") return;
    notifyMosBookingClick({ questSlug: quest.slug, venueSlug: venue.slug, offerId: offer.id, variantId: variant?.id });
    try { trackBookingExternal({
      questSlug: quest.slug,
      venueSlug: venue.slug,
      offerId: offer.id,
      schoolSlug,
    }); } catch { /* Analytics must never interrupt departure. */ }
  }

  const directLink = action.kind === "mos" ? (
    <a href={action.url} target="_blank" rel="noopener noreferrer"
      data-mos-booking-link="true"
      className={buttonVariants({ size: "sm", className: cn(buttonClassName, "min-h-11 whitespace-normal text-center") })}
      onClick={(event) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
          trackMosOpen();
          return;
        }
        event.preventDefault();
        triggerRef.current = event.currentTarget;
        formSession.current += 1;
        setSession(formSession.current);
        setView("mos_intro");
        setOpen(true);
      }}
      onAuxClick={(event) => { if (event.button === 1) trackMosOpen(); }}>
      <span className="relative z-10">{action.label} ↗</span>
    </a>
  ) : null;

  return (
    <div className={className}>
      {action.kind === "disabled" ? (
        <Button size="sm" className={buttonClassName} disabled>
          <span className="relative z-10">{action.label}</span>
        </Button>
      ) : action.kind === "mos" ? (
        <div data-mos-booking-actions>
          {directLink}
        </div>
      ) : (
        <Button size="sm" className={buttonClassName} onClick={event => openForm(event.currentTarget)}>
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
          initialFocus={action.kind === "mos" ? titleRef : undefined}
          finalFocus={() => {
            const destination = () => {
              const trigger = triggerRef.current;
              if (trigger?.isConnected && trigger.getClientRects().length && getComputedStyle(trigger).visibility !== "hidden") return trigger;
              const fallback = document.querySelector<HTMLElement>("[data-testid='course-finder'] h1")
                ?? document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("main");
              fallback?.setAttribute("tabindex", "-1");
              return fallback;
            };
            // The focus manager resolves this during cleanup, before React may
            // detach a replaced card. Re-check after commit; never steal focus.
            requestAnimationFrame(() => {
              if (document.activeElement === document.body) destination()?.focus({ preventScroll: true });
            });
            return destination() ?? false;
          }}
          className={cn(
            "grid h-[min(92dvh,760px)] grid-rows-[auto,minmax(0,1fr)] gap-0 overflow-hidden border-slate-800 bg-[#0F172A] p-0 text-slate-100 shadow-2xl shadow-black/50 sm:max-w-[410px]",
            view === "mos_intro" && "h-auto max-h-[92dvh] sm:max-w-[480px]",
            "[&_[data-slot=dialog-close]]:top-2 [&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:z-20 [&_[data-slot=dialog-close]]:size-11",
            "[&_[data-slot=dialog-close]]:text-slate-400 [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white",
          )}
        >
          <DialogHeader className="relative z-10 border-slate-700/80 border-b bg-[#0F172A] px-5 py-4 shadow-[0_10px_24px_rgba(2,6,23,0.35)]">
            <DialogTitle ref={titleRef} tabIndex={-1} className="pr-11 font-heading text-lg text-white outline-none">
              {view === "mos_intro" ? MOS_BOOKING_COPY.transitionTitle : view === "form"
                ? flowContext.title
                : flowContext.successTitle}
            </DialogTitle>
            {action.kind === "mos" && (view === "mos_intro" || view === "form") && <MosBookingCountdown
              key={`${action.url}:${session}`} ref={countdownRef}
              active={open && view === "mos_intro"} url={action.url} onDepart={trackMosOpen}
            />}
          </DialogHeader>
          {view === "mos_intro" && action.kind === "mos" ? (
            <div className="bm-scrollbar grid min-h-0 gap-4 overflow-y-auto overscroll-contain p-5" data-testid="mos-invitation">
              <div className="text-xs text-slate-400"><p>{quest.title}</p><p>{resolveVenueShortName(venue)} · {formatLabel}</p></div>
              <h3 className="font-heading text-xl font-semibold text-white">{MOS_BOOKING_COPY.transitionHeading}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{MOS_BOOKING_COPY.transitionText}</p>
              <p className="text-sm leading-relaxed text-slate-100">{MOS_BOOKING_COPY.transitionBenefit}</p>
              <Button variant="outline" className="h-auto min-h-11 whitespace-normal border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-cyan-100 hover:bg-cyan-400/20"
                type="button" onClick={() => openForm()}>{MOS_BOOKING_COPY.fillForm}</Button>
              <p className="text-xs leading-relaxed text-slate-400">{MOS_BOOKING_COPY.formHint}</p>
            </div>
          ) : view === "mos_success" && action.kind === "mos" ? (
            <div className="bm-scrollbar min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin]">
              <MosBookingSuccess
                mosUrl={action.url}
                title={flowContext.successTitle}
                text={flowContext.successText}
                onOpenMos={trackMosOpen}
              />
            </div>
          ) : view === "lead_success" ? (
            <div className="bm-scrollbar min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin]">
              <LeadFormSuccess
                title={flowContext.successTitle}
                text={flowContext.successText}
                onClose={() => setOpen(false)}
              />
            </div>
          ) : (
            <div className="bm-scrollbar min-h-0 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-gutter:stable] [scrollbar-width:thin]">
              {action.kind === "mos" && <div className="mb-4 grid gap-2 text-sm text-slate-300">
                <a href={action.url} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center rounded text-cyan-200 underline underline-offset-4 focus-visible:outline-2"
                  onClick={trackMosOpen} onAuxClick={(event) => { if (event.button === 1) trackMosOpen(); }}>
                  На mos.ru без анкеты ↗<span className="sr-only"> — в новой вкладке</span>
                </a>
                <p>Контакты отправляются только после заполнения анкеты и вашего согласия.</p>
              </div>}
              <BookingForm
                key={session}
                summary={{
                  venueName: resolveVenueShortName(venue),
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
                  variantTitle: variant
                    ? `${variant.type} · ${variant.time}`
                    : undefined,
                  venueSlug: venue.slug,
                  venueName: resolveVenueShortName(venue),
                  schoolSlug,
                }}
                flowContext={flowContext}
                onSuccess={() => {
                  if (session !== formSession.current) return;
                  if (action.kind === "mos") {
                    setView("mos_success");
                    return;
                  }
                  setView("lead_success");
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
