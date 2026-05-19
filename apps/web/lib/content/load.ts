import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";

import {
  loadCourseDetailSnapshot,
  loadCoursesFromSnapshot,
  loadMapSnapshot,
  loadWorldsFromSnapshot,
} from "@/lib/data/catalog-snapshot-loader";
import { scheduleV2ToOffersByQuest } from "@/lib/data/v2/v2-to-v1";
import { loadScheduleSnapshotV2 } from "@/lib/data/site-snapshot-loader";
import {
  questSchema,
  venueSchema,
  worldSchema,
  type Quest,
  type Venue,
  type World,
} from "@/lib/schemas";
import { isLiveScheduleClientEnabled } from "@/lib/offers/snapshot-client";
import { filterQuestsForSchool as filterQuestsForSchoolPure } from "@/lib/school-scope";

const CONTENT_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "content");

async function loadDirYaml<T>(
  dirName: string,
  parse: (data: unknown, file: string) => T,
): Promise<T[]> {
  const dir = path.join(CONTENT_ROOT, dirName);
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  const out: T[] = [];
  for (const name of names) {
    if (!name.endsWith(".yaml") && !name.endsWith(".yml")) continue;
    const filePath = path.join(dir, name);
    const raw = await fs.readFile(filePath, "utf8");
    const data = parseYaml(raw);
    out.push(parse(data, filePath));
  }
  return out;
}

async function loadWorldsFromYaml(): Promise<World[]> {
  return loadDirYaml("worlds", (data, file) => {
    const r = worldSchema.safeParse(data);
    if (!r.success) throw new Error(`Invalid world in ${file}: ${r.error.message}`);
    return r.data;
  });
}

async function loadVenuesFromYaml(): Promise<Venue[]> {
  return loadDirYaml("venues", (data, file) => {
    const r = venueSchema.safeParse(data);
    if (!r.success) throw new Error(`Invalid venue in ${file}: ${r.error.message}`);
    return r.data;
  });
}

async function loadQuestsFromYaml(): Promise<Quest[]> {
  return loadDirYaml("quests", (data, file) => {
    const r = questSchema.safeParse(data);
    if (!r.success) {
      throw new Error(`Invalid quest in ${file}: ${r.error.message}`);
    }
    return r.data;
  });
}

export async function loadWorlds(): Promise<World[]> {
  const fromSnapshot = await loadWorldsFromSnapshot();
  if (fromSnapshot && fromSnapshot.length > 0) return fromSnapshot;
  return loadWorldsFromYaml();
}

export async function loadVenues(): Promise<Venue[]> {
  const map = await loadMapSnapshot();
  if (map?.venues.length) return map.venues;
  return loadVenuesFromYaml();
}

async function loadQuestBodies(): Promise<Omit<Quest, "offers">[]> {
  const fromCatalog = await loadCoursesFromSnapshot();
  if (fromCatalog && fromCatalog.length > 0) return fromCatalog;
  const yamlQuests = await loadQuestsFromYaml();
  return yamlQuests.map(({ offers, ...rest }) => {
    void offers;
    return rest;
  });
}

/** Quest bodies for static shell when live schedule loads offers in the browser. */
export async function loadQuestsShell(): Promise<Quest[]> {
  const bodies = await loadQuestBodies();
  if (!isLiveScheduleClientEnabled()) {
    return loadQuests();
  }
  return bodies.map((q) => ({ ...q, offers: [] }));
}

export async function loadQuests(): Promise<Quest[]> {
  const [questBodies, schedule] = await Promise.all([
    loadQuestBodies(),
    loadScheduleSnapshotV2(),
  ]);

  const offersByQuest = scheduleV2ToOffersByQuest(schedule);

  if (process.env.SITE_SNAPSHOT_STRICT === "1" && schedule.events.length === 0) {
    throw new Error("[loadQuests] SITE_SNAPSHOT_STRICT: no schedule events loaded");
  }

  return questBodies.map((q) => ({
    ...q,
    offers: offersByQuest[q.slug] ?? [],
  }));
}

export async function loadQuestBySlug(slug: string): Promise<Quest | undefined> {
  const detail = await loadCourseDetailSnapshot(slug);
  const schedule = await loadScheduleSnapshotV2();
  const offersByQuest = scheduleV2ToOffersByQuest(schedule);
  const offers = offersByQuest[slug] ?? [];

  if (detail) {
    return { ...detail, offers };
  }

  const quests = await loadQuests();
  return quests.find((q) => q.slug === slug);
}

export async function loadWorldBySlug(slug: string): Promise<World | undefined> {
  const worlds = await loadWorlds();
  return worlds.find((w) => w.slug === slug);
}

export function venueBySlugMap(venues: Venue[]): Map<string, Venue> {
  return new Map(venues.map((v) => [v.slug, v]));
}

export function filterQuestsForSchool(
  quests: Quest[],
  venues: Venue[],
  schoolSlug: string | undefined,
): Quest[] {
  return filterQuestsForSchoolPure(quests, venues, schoolSlug);
}

export { loadScheduleSnapshotV2 } from "@/lib/data/site-snapshot-loader";
