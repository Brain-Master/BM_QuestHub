import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import {
  catalogSnapshotSchema,
  courseDetailSnapshotSchema,
  mapSnapshotSchema,
  type CatalogSnapshot,
  type MapSnapshot,
} from "@/lib/data/v2/catalog-snapshot";
import { assertNoPrivateFields } from "@/lib/data/v2/private-field-denylist";
import { resolvePublicSnapshotUrl } from "@/lib/data/public-snapshot-url";
import { siteManifestV2Schema } from "@/lib/data/v2/site-snapshot";
import { snapshotFetchInit } from "@/lib/data/snapshot-fetch";
import type { Quest, Venue, World } from "@/lib/schemas";

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

async function readManifest() {
  const url = manifestUrl();
  try {
    const data = url
      ? await readJsonFromUrl(url)
      : await readJsonFile(manifestPath());
    return siteManifestV2Schema.safeParse(data).success
      ? siteManifestV2Schema.parse(data)
      : null;
  } catch {
    return null;
  }
}

async function readSnapshotByManifestKey(
  key: string,
  defaultRelativePath: string,
): Promise<unknown | null> {
  const manifest = await readManifest();
  const relativePath = manifest?.snapshots[key]?.path ?? defaultRelativePath;
  const remoteUrl = resolvePublicSnapshotUrl(relativePath, {
    manifestUrl: manifestUrl(),
  });

  try {
    if (remoteUrl) {
      return await readJsonFromUrl(remoteUrl);
    }
    const localPath = path.join(/*turbopackIgnore: true*/ process.cwd(), relativePath);
    return await readJsonFile(localPath);
  } catch (e) {
    const err = e as Error;
    console.warn(`[catalog-loader] ${key} read failed (${relativePath}): ${err.message}`);
    return null;
  }
}

let cachedCatalog: CatalogSnapshot | null = null;
let cachedMap: MapSnapshot | null = null;

export function isRemoteCatalogSnapshotSource(): boolean {
  if (process.env.CATALOG_SNAPSHOT_SOURCE === "local") return false;
  if (process.env.CATALOG_SNAPSHOT_SOURCE === "s3") return true;
  return process.env.SITE_SNAPSHOT_SOURCE === "s3";
}

async function readLocalCatalog(): Promise<CatalogSnapshot | null> {
  const localPath = path.join(dataRoot(), "v2", "catalog-snapshot.json");
  try {
    const data = await readJsonFile(localPath);
    const parsed = catalogSnapshotSchema.safeParse(data);
    if (parsed.success) {
      assertNoPrivateFields(parsed.data);
      return parsed.data;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function loadCatalogSnapshot(): Promise<CatalogSnapshot | null> {
  if (cachedCatalog) return cachedCatalog;

  if (!isRemoteCatalogSnapshotSource()) {
    const local = await readLocalCatalog();
    if (local) {
      cachedCatalog = local;
      return cachedCatalog;
    }
  }

  const data = await readSnapshotByManifestKey(
    "catalog",
    "data/v2/catalog-snapshot.json",
  );
  if (!data) {
    const local = await readLocalCatalog();
    if (local) cachedCatalog = local;
    return cachedCatalog;
  }

  const parsed = catalogSnapshotSchema.safeParse(data);
  if (!parsed.success) {
    console.warn(`[catalog-loader] invalid catalog snapshot: ${parsed.error.message}`);
    return null;
  }
  assertNoPrivateFields(parsed.data);
  cachedCatalog = parsed.data;
  console.info(
    `[catalog-loader] loaded ${parsed.data.worlds.length} worlds, ${parsed.data.courses.length} courses`,
  );
  return cachedCatalog;
}

async function readLocalMap(): Promise<MapSnapshot | null> {
  const localPath = path.join(dataRoot(), "v2", "map-snapshot.json");
  try {
    const data = await readJsonFile(localPath);
    const parsed = mapSnapshotSchema.safeParse(data);
    if (parsed.success) {
      assertNoPrivateFields(parsed.data);
      return parsed.data;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function loadMapSnapshot(): Promise<MapSnapshot | null> {
  if (cachedMap) return cachedMap;

  if (!isRemoteCatalogSnapshotSource()) {
    const local = await readLocalMap();
    if (local) {
      cachedMap = local;
      return cachedMap;
    }
  }

  const data = await readSnapshotByManifestKey("map", "data/v2/map-snapshot.json");
  if (!data) {
    const local = await readLocalMap();
    if (local) cachedMap = local;
    return cachedMap;
  }

  const parsed = mapSnapshotSchema.safeParse(data);
  if (!parsed.success) {
    console.warn(`[catalog-loader] invalid map snapshot: ${parsed.error.message}`);
    return readLocalMap();
  }
  assertNoPrivateFields(parsed.data);
  cachedMap = parsed.data;
  console.info(`[catalog-loader] loaded ${parsed.data.venues.length} venues`);
  return cachedMap;
}

export async function loadCourseDetailSnapshot(
  slug: string,
): Promise<Quest | null> {
  const relativePath = `data/v2/detail/${slug}.json`;
  const remoteUrl = isRemoteCatalogSnapshotSource()
    ? resolvePublicSnapshotUrl(relativePath, { manifestUrl: manifestUrl() })
    : null;

  try {
    const data = remoteUrl
      ? await readJsonFromUrl(remoteUrl)
      : await readJsonFile(
          path.join(/*turbopackIgnore: true*/ process.cwd(), relativePath),
        );
    const parsed = courseDetailSnapshotSchema.safeParse(data);
    if (!parsed.success) return null;
    assertNoPrivateFields(parsed.data);
    return { ...parsed.data.course, offers: [] };
  } catch {
    return null;
  }
}

export async function loadWorldsFromSnapshot(): Promise<World[] | null> {
  const catalog = await loadCatalogSnapshot();
  return catalog?.worlds ?? null;
}

export async function loadVenuesFromSnapshot(): Promise<Venue[] | null> {
  const map = await loadMapSnapshot();
  return map?.venues ?? null;
}

export async function loadCoursesFromSnapshot(): Promise<
  Omit<Quest, "offers">[] | null
> {
  const catalog = await loadCatalogSnapshot();
  return catalog?.courses ?? null;
}
