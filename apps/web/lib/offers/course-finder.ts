import { annualProgrammeName } from "./annual-programme-name";
import { weekdays } from "./annual-schedule";
import type { ScheduleBoardItem } from "./schedule-board";

export type FinderState = {
  school: string;
  venue: string;
  programme: string;
  level: string;
  age: string;
  day: string;
  view: "wizard" | "catalogue";
  step: "school" | "campus" | "interest" | "results";
  method: "programme" | "age";
  grouping: "venues" | "programmes";
  offer: string;
  completed: "yes" | "no";
};

type Query = Pick<URLSearchParams, "get" | "has">;
const bounded = (value: string | null, fallback = "all") => value === null ? fallback : value.slice(0, 160);

/** A route school is authoritative. Unknown entity IDs are retained and fail closed. */
export function readFinderState(query: Query, routeSchool?: string, initialVenue?: string): FinderState {
  const school = routeSchool ?? bounded(query.get("school"));
  const programme = bounded(query.get("programme"));
  const hasSelection = ["venue", "campus", "programme", "age", "level", "day", "offer"].some(key => query.has(key));
  const view = query.get("view") === "wizard" ? "wizard" : query.get("view") === "catalogue" || hasSelection || initialVenue || !routeSchool ? "catalogue" : "wizard";
  const requestedStep = query.get("step");
  const step = query.get("offer") || view === "catalogue" ? "results" : ["school", "campus", "interest", "results"].includes(requestedStep ?? "") ? requestedStep as FinderState["step"] : school === "all" ? "school" : "campus";
  const age = query.get("age");
  return {
    school, venue: initialVenue ?? bounded(query.get("venue") ?? query.get("campus")), programme,
    level: programme === "shmi" && ["1", "2", "3"].includes(query.get("level") ?? "") ? query.get("level") ?? "all" : "all",
    age: age !== null && /^\d{1,2}$/.test(age) && Number(age) >= 3 && Number(age) <= 18 ? age : "all",
    day: /^[1-7]$/.test(query.get("day") ?? "") ? query.get("day") ?? "all" : "all",
    view, step, method: query.get("method") === "age" ? "age" : "programme",
    grouping: query.get("grouping") === "programmes" ? "programmes" : "venues",
    offer: bounded(query.get("offer"), ""),
    completed: query.get("completed") === "yes" || !!query.get("offer") || (view === "wizard" && step === "results") ? "yes" : "no",
  };
}

export function changeFinderState(state: FinderState, patch: Partial<FinderState>): FinderState {
  const selectionChanged = (["school", "venue", "programme", "level", "age", "day"] as const)
    .some(key => patch[key] !== undefined && patch[key] !== state[key]);
  const returningToQuestion = patch.step !== undefined && patch.step !== "results";
  const next = { ...state, ...patch, offer: patch.offer ?? (selectionChanged || returningToQuestion ? "" : state.offer) };
  if (patch.school !== undefined && patch.school !== state.school) next.venue = "all";
  if (next.programme !== "shmi") next.level = "all";
  if (next.view === "wizard" && next.step === "results") next.completed = "yes";
  return next;
}

/** Public query only; carries no tracking, credentials or personal child profile. */
export function finderQuery(state: FinderState): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) if (value !== "") query.set(key, value);
  return query.toString();
}

export function itemSchool(item: ScheduleBoardItem): string {
  return item.venue.schoolScopeSlug ?? item.venue.slug;
}

export function itemStudyYear(item: ScheduleBoardItem): number | null {
  if (item.quest.slug !== "shmi") return null;
  return annualProgrammeName(item.offer.annual?.sourceTitle ?? "").studyYear;
}

export function finderAgeLabel(item: ScheduleBoardItem): string {
  const min = item.offer.annual?.ageMin, max = item.offer.annual?.ageMax;
  if (min != null && max != null) return min === max ? `${min} лет` : `${min}–${max} лет`;
  if (min != null) return `От ${min} лет; верхний возраст уточняется`;
  if (max != null) return `До ${max} лет; нижний возраст уточняется`;
  return "Возраст уточняется";
}

export function finderItemMatches(item: ScheduleBoardItem, state: FinderState, ignoreVenue = false): boolean {
  if (item.quest.format !== "year") return false;
  if (state.school !== "all" && itemSchool(item) !== state.school) return false;
  if (!ignoreVenue && state.venue !== "all" && item.offer.venueSlug !== state.venue) return false;
  if (state.programme !== "all" && item.quest.slug !== state.programme) return false;
  if (state.level !== "all" && itemStudyYear(item) !== Number(state.level)) return false;
  const age = Number(state.age), metadata = item.offer.annual;
  if (state.age !== "all" && metadata) {
    if (metadata.ageMin !== null && age < metadata.ageMin) return false;
    if (metadata.ageMax !== null && age > metadata.ageMax) return false;
  }
  if (state.day !== "all" && !item.offer.weeklySlots?.some(slot => slot.weekday === weekdays[Number(state.day) - 1])) return false;
  return true;
}

export type FinderDay = {
  day: string;
  rows: { key: string; item: ScheduleBoardItem; start: string | null; end: string | null }[];
};

/** Repeat a multi-day group in its weekdays, never split its enrollment identity. */
export function groupFinderWeek(items: ScheduleBoardItem[], selectedDay = "all"): FinderDay[] {
  const days: FinderDay[] = [...weekdays, "Время уточняется"].map(day => ({ day, rows: [] }));
  const seen = new Set<string>();
  for (const item of items) {
    const slots = item.offer.weeklySlots ?? [];
    if (!slots.length && selectedDay === "all") days[7].rows.push({ key: item.offer.id, item, start: null, end: null });
    for (const slot of slots) {
      const index = weekdays.indexOf(slot.weekday);
      if (selectedDay !== "all" && index !== Number(selectedDay) - 1) continue;
      const key = `${item.offer.id}:${slot.weekday}:${slot.start}:${slot.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      days[index].rows.push({ key, item, start: slot.start, end: slot.end });
    }
  }
  return days.filter(day => day.rows.length).map(day => ({ ...day, rows: day.rows.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "") || a.item.venue.address.localeCompare(b.item.venue.address, "ru") || a.item.offer.id.localeCompare(b.item.offer.id)) }));
}
