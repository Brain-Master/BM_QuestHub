import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

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
  const manifestUrl = process.env.SITE_SNAPSHOT_MANIFEST_URL?.trim();
  if (manifestUrl) {
    try {
      const base = new URL(manifestUrl);
      return new URL("data/v2/site-config.json", base).toString();
    } catch {
      return null;
    }
  }

  if (process.env.SITE_SNAPSHOT_SOURCE !== "s3") return null;

  const publicBase = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  if (!publicBase) return null;

  const base = publicBase.endsWith("/") ? publicBase : `${publicBase}/`;
  return new URL("data/v2/site-config.json", base).toString();
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
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return parseSiteConfig((await res.json()) as unknown);
}

/** Cached site config (brand, navigation, cities, map, dictionaries). */
export async function loadSiteConfig(): Promise<SiteConfig> {
  if (cachedConfig) return cachedConfig;

  const url = siteConfigUrl();
  try {
    cachedConfig = url ? await readRemoteSiteConfig(url) : await readLocalSiteConfig();
  } catch (e) {
    const err = e as Error;
    console.error("[site-config] load error:", err.message);
    if (!cachedConfig) {
      cachedConfig = await readLocalSiteConfig();
    }
  }

  return cachedConfig!;
}
