"use client";
import { useSyncExternalStore } from "react";
const snapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const serverSnapshot = () => 0;
function subscribe(notify: () => void) {
  const timer = setInterval(notify, 60_000);
  return () => clearInterval(timer);
}
export function useScheduleClock() { return useSyncExternalStore(subscribe, snapshot, serverSnapshot); }
