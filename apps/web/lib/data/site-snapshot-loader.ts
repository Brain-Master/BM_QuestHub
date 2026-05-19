import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { assertNoPrivateFields } from "@/lib/data/v2/private-field-denylist";
import {
  resolvePublicSnapshotUrl,
} from "@/lib/data/public-snapshot-url";
import {
  scheduleSnapshotV2Schema,
  siteManifestV2Schema,
  type ScheduleSnapshotV2,
  type SiteManifestV2,
} from "@/lib/data/v2/site-snapshot";
import { offersSnapshotV1ToScheduleV2 } from "@/lib/data/v2/v1-to-v2";
import { snapshotFetchInit } from "@/lib/data/snapshot-fetch";
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

  return resolvePublicSnapshotUrl("data/v2/site-manifest.json");
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

async function readJsonFromUrl(url: string): Promise<unknown> {
  const res = await fetch(url, snapshotFetchInit());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<unknown>;
}

async function readManifest(): Promise<SiteManifestV2 | null> {
  const url = manifestUrl();
  const source = url ?? manifestPath();
  try {
    const data = url
      ? await readJsonFromUrl(url)
      : await readJsonFile(manifestPath());
    const parsed = siteManifestV2Schema.safeParse(data);
    if (parsed.success) {
      console.info(`[site-manifest] loaded from ${source}`);
      return parsed.data;
    }
    console.warn(`[site-manifest] invalid payload from ${source}`);
    return null;
  } catch (e) {
    const err = e as Error;
    console.warn(`[site-manifest] read failed (${source}): ${err.message}`);
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
      const remoteUrl = resolvePublicSnapshotUrl(schedulePath, {
        manifestUrl: manifestUrl(),
      });
      const data = remoteUrl
        ? await readJsonFromUrl(remoteUrl)
        : await readJsonFile(
            path.join(/*turbopackIgnore: true*/ process.cwd(), schedulePath),
          );
      const parsed = scheduleSnapshotV2Schema.safeParse(data);
      if (parsed.success) {
        assertNoPrivateFields(parsed.data);
        const scheduleSource =
          remoteUrl ?? path.join(/*turbopackIgnore: true*/ process.cwd(), schedulePath);
        console.info(
          `[schedule-snapshot-v2] loaded ${parsed.data.events.length} events from ${scheduleSource}`,
        );
        cachedSchedule = parsed.data;
        return cachedSchedule;
      }
      console.warn(
        `[schedule-snapshot-v2] invalid payload from ${schedulePath}, using offers fallback`,
      );
    } catch (e) {
      const err = e as Error;
      console.warn(
        `[schedule-snapshot-v2] read failed (${schedulePath}): ${err.message}, using offers fallback`,
      );
    }
  }

  const v1 = await readOffersSnapshot();
  const schedule = offersSnapshotV1ToScheduleV2(v1);
  assertNoPrivateFields(schedule);
  console.info(
    `[schedule-snapshot-v2] built ${schedule.events.length} events from offers snapshot`,
  );

  if (process.env.SITE_SNAPSHOT_STRICT === "1" && schedule.events.length === 0) {
    throw new Error("[schedule-snapshot-v2] strict mode: no events loaded");
  }

  cachedSchedule = schedule;
  return schedule;
}
