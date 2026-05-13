"use client";

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

export function trackBookingExternal(params: {
  questSlug: string;
  venueSlug: string;
  offerId: string;
  schoolSlug?: string;
}) {
  reachGoal("booking_mos_click", {
    quest_id: params.questSlug,
    venue_id: params.venueSlug,
    offer_id: params.offerId,
    school_slug: params.schoolSlug ?? "",
  });
}

export function trackBookingFormOpen(params: {
  questSlug: string;
  venueSlug: string;
  offerId: string;
  schoolSlug?: string;
}) {
  reachGoal("booking_form_open", {
    quest_id: params.questSlug,
    venue_id: params.venueSlug,
    offer_id: params.offerId,
    school_slug: params.schoolSlug ?? "",
  });
}
