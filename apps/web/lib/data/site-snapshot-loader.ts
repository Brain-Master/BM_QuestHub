import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { assertNoPrivateFields } from "@/lib/data/v2/private-field-denylist";
import {
  scheduleSnapshotV2Schema,
  siteManifestV2Schema,
  type ScheduleSnapshotV2,
  type SiteManifestV2,
} from "@/lib/data/v2/site-snapshot";
import { offersSnapshotV1ToScheduleV2 } from "@/lib/data/v2/v1-to-v2";
import { readOffersSnapshot } from "@/lib/offers/snapshot-io";

function dataRoot(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
}

function manifestPath(): string {
  const override = process.env.SITE_SNAPSHOT_MANIFEST_PATH?.trim();
  if (override) return path.resolve(/*turbopackIgnore: true*/ override);
  return path.join(dataRoot(), "v2", "site-manifest.json");
}

function manifestUrl(): string | null {
  const explicit = process.env.SITE_SNAPSHOT_MANIFEST_URL?.trim();
  if (explicit) return explicit;

  if (process.env.SITE_SNAPSHOT_SOURCE !== "s3") return null;

  const publicBase = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  if (!publicBase) return null;

  const base = publicBase.endsWith("/") ? publicBase : `${publicBase}/`;
  return new URL("data/v2/site-manifest.json", base).toString();
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

async function readManifest(): Promise<SiteManifestV2 | null> {
  const url = manifestUrl();
  try {
    const data = url
      ? await (async () => {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })()
      : await readJsonFile(manifestPath());
    const parsed = siteManifestV2Schema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch (e) {
    const err = e as Error;
    console.error("[site-manifest] read error:", err.message);
    return null;
  }
}

let cachedSchedule: ScheduleSnapshotV2 | null = null;

/**
 * Schedule events in V2 shape. Builds from V1 offers snapshot until a dedicated
 * `schedule-snapshot.json` is published by the producer.
 */
export async function loadScheduleSnapshotV2(): Promise<ScheduleSnapshotV2> {
  if (cachedSchedule) return cachedSchedule;

  const manifest = await readManifest();
  const schedulePath = manifest?.snapshots.schedule?.path;

  if (schedulePath && schedulePath.endsWith("schedule-snapshot.json")) {
    try {
      const file = path.join(/*turbopackIgnore: true*/ process.cwd(), schedulePath);
      const data = await readJsonFile(file);
      const parsed = scheduleSnapshotV2Schema.safeParse(data);
      if (parsed.success) {
        assertNoPrivateFields(parsed.data);
        cachedSchedule = parsed.data;
        return cachedSchedule;
      }
    } catch (e) {
      const err = e as Error;
      console.error("[schedule-snapshot-v2] read error:", err.message);
    }
  }

  const v1 = await readOffersSnapshot();
  const schedule = offersSnapshotV1ToScheduleV2(v1);
  assertNoPrivateFields(schedule);

  if (process.env.SITE_SNAPSHOT_STRICT === "1" && schedule.events.length === 0) {
    throw new Error("[schedule-snapshot-v2] strict mode: no events loaded");
  }

  cachedSchedule = schedule;
  return schedule;
}
