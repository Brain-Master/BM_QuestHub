import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";

import {
  questSchema,
  venueSchema,
  worldSchema,
  type Quest,
  type Venue,
  type World,
} from "@/lib/schemas";
import { readOffersSnapshot } from "@/lib/offers/snapshot-io";
import { filterQuestsForSchool as filterQuestsForSchoolPure } from "@/lib/school-scope";

const CONTENT_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "content");

let strictScheduleV2Validated = false;

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

export async function loadWorlds(): Promise<World[]> {
  return loadDirYaml("worlds", (data, file) => {
    const r = worldSchema.safeParse(data);
    if (!r.success) throw new Error(`Invalid world in ${file}: ${r.error.message}`);
    return r.data;
  });
}

export async function loadVenues(): Promise<Venue[]> {
  return loadDirYaml("venues", (data, file) => {
    const r = venueSchema.safeParse(data);
    if (!r.success) throw new Error(`Invalid venue in ${file}: ${r.error.message}`);
    return r.data;
  });
}

export async function loadQuests(): Promise<Quest[]> {
  const [questsRaw, snapshot] = await Promise.all([
    loadDirYaml("quests", (data, file) => {
      const r = questSchema.safeParse(data);
      if (!r.success) {
        throw new Error(`Invalid quest in ${file}: ${r.error.message}`);
      }
      return r.data;
    }),
    readOffersSnapshot(),
  ]);

  if (process.env.SITE_SNAPSHOT_STRICT === "1" && !strictScheduleV2Validated) {
    strictScheduleV2Validated = true;
    const { offersSnapshotV1ToScheduleV2 } = await import("@/lib/data/v2/v1-to-v2");
    const { assertNoPrivateFields } = await import("@/lib/data/v2/private-field-denylist");
    const scheduleV2 = offersSnapshotV1ToScheduleV2(snapshot);
    assertNoPrivateFields(scheduleV2);
    if (scheduleV2.events.length === 0) {
      throw new Error(
        "[site-snapshot-v2] SITE_SNAPSHOT_STRICT: V1 offers produced zero V2 events",
      );
    }
  }

  return questsRaw.map((q) => ({
    ...q,
    offers: snapshot.offersByQuest[q.slug] ?? [],
  }));
}

export async function loadQuestBySlug(slug: string): Promise<Quest | undefined> {
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
