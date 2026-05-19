import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { resolvePublicSnapshotUrl } from "@/lib/data/public-snapshot-url";
import { snapshotFetchInit } from "@/lib/data/snapshot-fetch";
import {
  siteConfigSchema,
  type SiteConfig,
} from "@/lib/data/v2/site-config";
import { assertNoPrivateFields } from "@/lib/data/v2/private-field-denylist";
import { applyTemplate } from "@/lib/data/template";

export { applyTemplate };

let cachedConfig: SiteConfig | null = null;

function siteConfigPath(): string {
  const override = process.env.SITE_CONFIG_PATH?.trim();
  if (override) return path.resolve(/*turbopackIgnore: true*/ override);
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "v2", "site-config.json");
}

function siteConfigUrl(): string | null {
  if (process.env.SITE_SNAPSHOT_SOURCE !== "s3") return null;

  const manifestUrl = process.env.SITE_SNAPSHOT_MANIFEST_URL?.trim() || null;
  return resolvePublicSnapshotUrl("data/v2/site-config.json", { manifestUrl });
}

export function parseSiteConfig(data: unknown): SiteConfig {
  const parsed = siteConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `[site-config] invalid payload: ${parsed.error.message}`,
    );
  }
  assertNoPrivateFields(parsed.data);
  return parsed.data;
}

async function readLocalSiteConfig(): Promise<SiteConfig> {
  const file = siteConfigPath();
  const raw = await fs.readFile(file, "utf8");
  return parseSiteConfig(JSON.parse(raw) as unknown);
}

async function readRemoteSiteConfig(url: string): Promise<SiteConfig> {
  const res = await fetch(url, snapshotFetchInit());
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return parseSiteConfig((await res.json()) as unknown);
}

/** Cached site config (brand, navigation, cities, map, dictionaries). */
export async function loadSiteConfig(): Promise<SiteConfig> {
  if (cachedConfig) return cachedConfig;

  const url = siteConfigUrl();
  const localPath = siteConfigPath();
  try {
    if (url) {
      cachedConfig = await readRemoteSiteConfig(url);
      console.info(`[site-config] loaded from ${url}`);
    } else {
      cachedConfig = await readLocalSiteConfig();
      console.info(`[site-config] loaded from local ${localPath}`);
    }
  } catch (e) {
    const err = e as Error;
    console.warn(
      `[site-config] remote load failed${url ? ` (${url})` : ""}: ${err.message}, falling back to local ${localPath}`,
    );
    cachedConfig = await readLocalSiteConfig();
    console.info(`[site-config] loaded from local ${localPath}`);
  }

  return cachedConfig!;
}
