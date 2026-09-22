import siteConfig from "@/data/v2/site-config.json";

export type MosClickTarget = {
  questSlug: string;
  offerId: string;
  venueSlug: string;
  variantId?: string;
};

/** Best effort, no retry, no persistent identity and no awaited navigation. */
export function createMosClickNotifier(
  endpoint: string,
  request: typeof fetch = (...args) => fetch(...args),
  now = Date.now,
  uuid = () => crypto.randomUUID(),
) {
  const recent = new Map<string, number>();
  return (target: MosClickTarget): void => {
    try {
      if (!endpoint) return;
      const key = JSON.stringify([target.questSlug, target.offerId, target.venueSlug, target.variantId]);
      const time = now();
      for (const [id, at] of recent) if (time - at >= 30_000) recent.delete(id);
      if (recent.has(key) || recent.size >= 128) return;
      const body = JSON.stringify({ event: "booking.mos_click", eventId: uuid(),
        questSlug: target.questSlug, offerId: target.offerId, venueSlug: target.venueSlug,
        ...(target.variantId ? { variantId: target.variantId } : {}),
      });
      recent.set(key, time);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      try {
        void request(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
          body, keepalive: true, credentials: "omit", referrerPolicy: "no-referrer",
          redirect: "error", signal: controller.signal,
        }).catch(() => {}).finally(() => clearTimeout(timer));
      } catch { clearTimeout(timer); }
    } catch { /* Notification support must never break a native link. */ }
  };
}

export const notifyMosBookingClick = createMosClickNotifier(
  process.env.NEXT_PUBLIC_LEAD_SUBMIT_URL?.trim() || siteConfig.brand.contacts.leadSubmitUrl?.trim() || "",
);
