"use client";

import type { AnalyticsScope } from "@/lib/analytics-scope";

function ymId(): number | null {
  const raw = process.env.NEXT_PUBLIC_YM_ID;
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function reachGoal(
  goal: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  if (typeof window === "undefined") return;
  const id = ymId();
  if (!id || !window.ym) return;
  const clean = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined),
      )
    : undefined;
  window.ym(id, "reachGoal", goal, clean);
}

/** Visit-level params in Yandex Metrika (all hits in the session). */
export function setVisitParams(params: {
  scope: AnalyticsScope;
  school_slug: string;
}) {
  if (typeof window === "undefined") return;
  const id = ymId();
  if (!id || !window.ym) return;
  window.ym(id, "params", {
    scope: params.scope,
    school_slug: params.school_slug,
  });
}

export type BookingAnalyticsParams = {
  questSlug: string;
  venueSlug: string;
  offerId: string;
  schoolSlug?: string;
  leadType?: string;
  registrationChannel?: string;
};

function bookingGoalParams(params: BookingAnalyticsParams) {
  return {
    quest_id: params.questSlug,
    venue_id: params.venueSlug,
    offer_id: params.offerId,
    school_slug: params.schoolSlug ?? "",
    ...(params.leadType ? { lead_type: params.leadType } : {}),
    ...(params.registrationChannel
      ? { registration_channel: params.registrationChannel }
      : {}),
  };
}

export function trackBookingFormOpen(params: BookingAnalyticsParams) {
  reachGoal("booking_form_open", bookingGoalParams(params));
}

export function trackBookingExternal(params: BookingAnalyticsParams) {
  reachGoal("booking_mos_click", bookingGoalParams(params));
}

export function trackBookingLeadSubmit(params: BookingAnalyticsParams) {
  reachGoal("booking_lead_submit", bookingGoalParams(params));
}
