"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "bm_schedule_pulse_at";
const MIN_INTERVAL_MS = 5 * 60 * 1000;

function pulseUrl(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_SCHEDULE_PULSE_URL?.trim();
  return fromEnv || null;
}

type Options = {
  page: "agenda" | "quest_schedule";
  enabled?: boolean;
};

export function useScheduleTrafficPulse({ page, enabled = true }: Options) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!enabled || sentRef.current) return;
    const url = pulseUrl();
    if (!url) return;

    try {
      const last = sessionStorage.getItem(STORAGE_KEY);
      if (last && Date.now() - Number(last) < MIN_INTERVAL_MS) return;
    } catch {
      /* private mode */
    }

    sentRef.current = true;
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ page, ts: Date.now() }),
      keepalive: true,
    })
      .then((res) => {
        if (!res.ok) return;
        try {
          sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        sentRef.current = false;
      });
  }, [enabled, page]);
}
