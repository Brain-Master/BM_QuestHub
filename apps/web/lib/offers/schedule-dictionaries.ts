import siteConfig from "@/data/v2/site-config.json";

import type { EventStatusV2 } from "@/lib/data/v2/entities";

export type ScheduleStatusVariant =
  | "success"
  | "info"
  | "purple"
  | "warning"
  | "default"
  | "destructive";

export const SCHEDULE_DICTIONARIES = siteConfig.dictionaries;

export const SCHEDULE_CTA = SCHEDULE_DICTIONARIES.scheduleCta;

export const CAPACITY_LABELS = SCHEDULE_DICTIONARIES.capacity;

export const SHEET_PLANNING_STATUSES = new Set(
  SCHEDULE_DICTIONARIES.sheetPlanningStatuses,
);

const RAW_STATUS_TO_KEY: Record<string, EventStatusV2> = {
  отменено: "cancelled",
  "можно присоединиться": "join_late",
  "мест нет": "sold_out",
  "идёт набор": "recruiting",
  "идет набор": "recruiting",
  "скоро старт": "planning",
  завершено: "finished",
};

export function eventStatusLabel(key: EventStatusV2): string {
  return SCHEDULE_DICTIONARIES.eventStatus[key]?.label ?? "";
}

export function eventStatusVariant(key: EventStatusV2): ScheduleStatusVariant {
  const variant = SCHEDULE_DICTIONARIES.eventStatus[key]?.variant;
  return (variant ?? "default") as ScheduleStatusVariant;
}

export function isEventStatusLive(key: EventStatusV2): boolean {
  const entry = SCHEDULE_DICTIONARIES.eventStatus[key];
  return entry !== undefined && "livePulse" in entry && entry.livePulse === true;
}

export function isScheduleDisplayStatusLive(label: string): boolean {
  return Object.values(SCHEDULE_DICTIONARIES.eventStatus).some(
    (entry) =>
      "livePulse" in entry && entry.livePulse === true && entry.label === label,
  );
}

export function rawSheetStatusToKey(raw: string): EventStatusV2 | undefined {
  return RAW_STATUS_TO_KEY[raw.trim().toLowerCase()];
}

export function statusVariantByLabel(label: string): ScheduleStatusVariant {
  const entry = Object.entries(SCHEDULE_DICTIONARIES.eventStatus).find(
    ([, value]) => value.label === label,
  );
  return entry ? eventStatusVariant(entry[0] as EventStatusV2) : "default";
}
