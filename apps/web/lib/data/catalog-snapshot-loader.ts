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
import {
  allowLocalSnapshotFallback,
  isRemoteCatalogSnapshotSource,
  isRetriableFetchError,
  isStrictRemoteCatalogLoad,
  strictSnapshotLoadError,
} from "@/lib/data/snapshot-load-policy";
import { siteManifestV2Schema } from "@/lib/data/v2/site-snapshot";
import { snapshotFetchInit } from "@/lib/data/snapshot-fetch";
import type { Quest, Venue, World } from "@/lib/schemas";

export {
  isRemoteCatalogSnapshotSource,
  isStrictRemoteCatalogLoad,
} from "@/lib/data/snapshot-load-policy";

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
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
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

function shouldFallbackToLocalAfterRemoteFailure(err: unknown): boolean {
  if (!isRemoteCatalogSnapshotSource()) return true;
  if (isStrictRemoteCatalogLoad() && !allowLocalSnapshotFallback()) return false;
  if (!isRetriableFetchError(err)) return false;
  return allowLocalSnapshotFallback();
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

  if (remoteUrl) {
    try {
      return await readJsonFromUrl(remoteUrl);
    } catch (e) {
      if (isStrictRemoteCatalogLoad() && !shouldFallbackToLocalAfterRemoteFailure(e)) {
        throw strictSnapshotLoadError(key, remoteUrl, e);
      }
      const err = e as Error;
      console.warn(
        `[catalog-loader] ${key} read failed (${relativePath}): ${err.message}`,
      );
      if (!shouldFallbackToLocalAfterRemoteFailure(e)) {
        return null;
      }
    }
  }

  const localPath = path.join(/*turbopackIgnore: true*/ process.cwd(), relativePath);
  try {
    return await readJsonFile(localPath);
  } catch (e) {
    if (isStrictRemoteCatalogLoad()) {
      const target = remoteUrl ?? localPath;
      throw strictSnapshotLoadError(key, target, e);
    }
    return null;
  }
}

function assertStrictSnapshotPresent(
  key: string,
  data: unknown | null,
): asserts data is unknown {
  if (data != null) return;
  if (isStrictRemoteCatalogLoad()) {
    throw new Error(`[catalog-loader] strict: ${key} snapshot missing or unreadable`);
  }
}

let cachedCatalog: CatalogSnapshot | null = null;
let cachedMap: MapSnapshot | null = null;

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
    assertStrictSnapshotPresent("catalog", local);
    if (local) cachedCatalog = local;
    return cachedCatalog;
  }

  const parsed = catalogSnapshotSchema.safeParse(data);
  if (!parsed.success) {
    const msg = `[catalog-loader] invalid catalog snapshot: ${parsed.error.message}`;
    if (isStrictRemoteCatalogLoad()) throw new Error(msg);
    console.warn(msg);
    return readLocalCatalog();
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
    assertStrictSnapshotPresent("map", local);
    if (local) cachedMap = local;
    return cachedMap;
  }

  const parsed = mapSnapshotSchema.safeParse(data);
  if (!parsed.success) {
    const msg = `[catalog-loader] invalid map snapshot: ${parsed.error.message}`;
    if (isStrictRemoteCatalogLoad()) throw new Error(msg);
    console.warn(msg);
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
    if (!parsed.success) {
      if (isStrictRemoteCatalogLoad()) {
        throw new Error(
          `[catalog-loader] strict: invalid detail snapshot for ${slug}: ${parsed.error.message}`,
        );
      }
      return null;
    }
    assertNoPrivateFields(parsed.data);
    return { ...parsed.data.course, offers: [] };
  } catch (e) {
    if (isStrictRemoteCatalogLoad() && remoteUrl) {
      throw strictSnapshotLoadError(`detail/${slug}`, remoteUrl, e);
    }
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
