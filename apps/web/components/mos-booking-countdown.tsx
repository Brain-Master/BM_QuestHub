"use client";

import * as React from "react";
import { MOS_BOOKING_COPY } from "@/content/mos-booking-copy";

export type MosCountdownHandle = { stop: () => void };
const COUNTDOWN_MS = 15_000;

/** A controllable departure, not a deadline for completing the contact form. */
export const MosBookingCountdown = React.forwardRef<MosCountdownHandle, {
  active: boolean;
  url: string;
  onDepart: () => void;
}>(function MosBookingCountdown({ active, url, onDepart }, ref) {
  const [seconds, setSeconds] = React.useState(COUNTDOWN_MS / 1000);
  const [paused, setPaused] = React.useState(false);
  const cancelled = React.useRef(false);
  const interval = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const frame = React.useRef<number | null>(null);
  const progress = React.useRef<HTMLDivElement>(null);
  const depart = React.useRef(onDepart);
  React.useEffect(() => { depart.current = onDepart; }, [onDepart]);
  const stop = React.useCallback(() => {
    cancelled.current = true;
    if (interval.current !== null) clearInterval(interval.current);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    setPaused(true);
  }, []);
  React.useImperativeHandle(ref, () => ({ stop }), [stop]);

  React.useEffect(() => {
    if (!active || cancelled.current) return;
    let live = true;
    const deadline = performance.now() + COUNTDOWN_MS;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Paint the exact remaining fraction without a React render every frame.
    const paint = () => {
      if (!live || cancelled.current) return;
      if (document.hidden) { stop(); return; }
      if (progress.current) progress.current.style.transform = `scaleX(${Math.max(0, (deadline - performance.now()) / COUNTDOWN_MS)})`;
      frame.current = requestAnimationFrame(paint);
    };
    const syncMotion = () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (!live || cancelled.current) return;
      if (reducedMotion.matches) {
        if (progress.current) progress.current.style.transform = "scaleX(1)";
      } else paint();
    };
    const hidden = () => { if (document.hidden) stop(); };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) stop(); };
    const tick = () => {
      if (!live || cancelled.current) return;
      if (document.hidden) { stop(); return; }
      const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      setSeconds(left);
      if (left === 0) {
        stop();
        // Best-effort notification must not control navigation or delay it.
        try { depart.current(); } finally { window.location.assign(url); }
      }
    };
    interval.current = setInterval(tick, 250);
    syncMotion();
    reducedMotion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pageshow", restored);
    return () => {
      live = false;
      if (interval.current !== null) clearInterval(interval.current);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      reducedMotion.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pageshow", restored);
    };
  }, [active, url, stop]);

  const running = active && !paused;
  return <section className="mt-4 grid gap-2 rounded-xl border border-slate-600 bg-slate-950/40 p-3" aria-label="Переход на mos.ru" data-testid="mos-departure">
    {running ? <p role="timer" aria-live="off" className="text-sm text-slate-200">
      Переход через <strong className="text-white tabular-nums" data-testid="mos-seconds">{seconds}</strong> с
    </p> : <p role="status" className="text-sm text-slate-200">{MOS_BOOKING_COPY.timerStopped}</p>}
    <p className="text-xs text-slate-400">{MOS_BOOKING_COPY.sameTab}</p>
    {running && <div aria-hidden="true" className="h-1 overflow-hidden rounded bg-slate-700">
      <div ref={progress} data-testid="mos-progress" className="h-full origin-left bg-lime-300" />
    </div>}
    <a href={url} data-testid="mos-proceed-now"
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-lime-300 px-3 py-2 text-center text-sm font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
      onClick={() => { stop(); onDepart(); }}
      onAuxClick={event => { if (event.button === 1) { stop(); onDepart(); } }}>
      {MOS_BOOKING_COPY.proceedNow} →
    </a>
    {running && <button type="button" className="min-h-11 rounded px-2 text-sm text-slate-200 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-lime-300"
      onClick={stop}>{MOS_BOOKING_COPY.pauseTimer}</button>}
  </section>;
});
