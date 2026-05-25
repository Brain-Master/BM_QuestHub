#!/usr/bin/env node
/**
 * Pre-build check: public S3 snapshot URLs respond and contain schedule data.
 * No-op when SITE_SNAPSHOT_SOURCE and OFFERS_SNAPSHOT_SOURCE are not "s3".
 *
 * When S3 is unreachable from the build network (timeout), falls back to
 * committed files under apps/web/data so Timeweb deploy is not blocked by CDN blips.
 * HTTP 403/401/404 never fall back — build must fail so stale git is not baked in.
 *
 *   node scripts/verify-s3-snapshots.mjs
 */
import fs from "node:fs";
import path from "node:path";

const FETCH_TIMEOUT_MS = 12_000;

function normalizeBase(base) {
  return base.endsWith("/") ? base : `${base}/`;
}

function publicBaseUrl() {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  return base && base.length > 0 ? base : null;
}

function webDataDir() {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "data"),
    path.join(cwd, "apps", "web", "data"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "offers-snapshot.json"))) return dir;
  }
  return candidates[0];
}

/**
 * Path-style S3 URL → bucket root (`https://host/<bucket>/`).
 * Manifest paths are relative to bucket root, not the manifest file directory.
 */
function snapshotBaseUrlFromManifest(manifestUrl) {
  try {
    const u = new URL(manifestUrl);
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;
    const bucket = segments[0];
    return `${u.origin}/${bucket}/`;
  } catch {
    return null;
  }
}

function resolveAgainstBase(relativePath, base) {
  const rel = relativePath.replace(/^\//, "");
  try {
    return new URL(rel, normalizeBase(base)).toString();
  } catch {
    return null;
  }
}

/**
 * Resolve manifest-relative paths (e.g. data/v2/map-snapshot.json).
 * When manifestUrl is set, it only signals remote mode — base is bucket root, not the manifest file URL.
 */
function resolveUrl(relativePath, manifestUrl) {
  const manifest = manifestUrl?.trim() || null;
  if (manifest) {
    const base = publicBaseUrl() ?? snapshotBaseUrlFromManifest(manifest);
    if (base) return resolveAgainstBase(relativePath, base);
  }
  const base = publicBaseUrl();
  if (!base) return null;
  return resolveAgainstBase(relativePath, base);
}

function isNetworkError(err) {
  const code = err?.cause?.code || err?.code;
  if (
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "EAI_AGAIN"
  ) {
    return true;
  }
  if (err?.name === "AbortError" || err?.name === "TimeoutError") return true;
  return /fetch failed/i.test(String(err?.message ?? ""));
}

function readLocalJson(relPath, label) {
  const file = path.join(webDataDir(), relPath.replace(/^\//, ""));
  if (!fs.existsSync(file)) {
    throw new Error(`${label}: local file missing (${file})`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function fetchJsonRemote(url, label) {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function loadJson({ url, localRel, label }) {
  if (!url) {
    return { data: readLocalJson(localRel, label), source: `local:${localRel}` };
  }
  try {
    const data = await fetchJsonRemote(url, label);
    return { data, source: url };
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    const data = readLocalJson(localRel, label);
    console.warn(
      `[verify-s3] ${label}: remote unreachable (${err.message}), using local ${localRel}`,
    );
    return { data, source: `local:${localRel}` };
  }
}

function countV1Offers(snapshot) {
  if (!snapshot || snapshot.version !== 1 || !snapshot.offersByQuest) return 0;
  let total = 0;
  for (const offers of Object.values(snapshot.offersByQuest)) {
    if (Array.isArray(offers)) total += offers.length;
  }
  return total;
}

function countV2Events(snapshot) {
  if (!snapshot || snapshot.version !== 2 || !Array.isArray(snapshot.events)) {
    return 0;
  }
  return snapshot.events.length;
}

async function main() {
  const siteSource = process.env.SITE_SNAPSHOT_SOURCE?.trim();
  const offersSource = process.env.OFFERS_SNAPSHOT_SOURCE?.trim();
  const useS3 = siteSource === "s3" || offersSource === "s3";

  if (!useS3) {
    console.log("[verify-s3] skip: snapshot sources are not s3");
    return;
  }

  const base = publicBaseUrl();
  if (!base) {
    console.error(
      "[verify-s3] NEXT_PUBLIC_S3_PUBLIC_BASE_URL is required when using s3 snapshot sources",
    );
    process.exit(1);
  }

  const manifestExplicit = process.env.SITE_SNAPSHOT_MANIFEST_URL?.trim() || null;
  const manifestUrl =
    manifestExplicit ||
    (siteSource === "s3" ? resolveUrl("data/v2/site-manifest.json", null) : null);

  let schedulePath = "data/offers-snapshot.json";
  /** @type {Record<string, unknown> | null} */
  let manifest = null;
  if (manifestUrl || siteSource === "s3") {
    const { data: manifestData, source: manifestSource } = await loadJson({
      url: manifestUrl,
      localRel: "v2/site-manifest.json",
      label: "manifest",
    });
    manifest = manifestData;
    if (manifest?.snapshots?.schedule?.path) {
      schedulePath = manifest.snapshots.schedule.path;
    }
    console.log(`[verify-s3] manifest OK: ${manifestSource}`);
  } else if (siteSource === "s3") {
    console.error("[verify-s3] SITE_SNAPSHOT_SOURCE=s3 but manifest URL missing");
    process.exit(1);
  }

  const offersExplicit = process.env.OFFERS_SNAPSHOT_URL?.trim() || null;
  let offerCount = 0;
  let scheduleLabel = "";

  if (schedulePath.endsWith("schedule-snapshot.json")) {
    const scheduleUrl = resolveUrl(schedulePath, manifestUrl);
    const localRel = schedulePath.replace(/^data\//, "");
    const { data: schedule, source } = await loadJson({
      url: scheduleUrl,
      localRel,
      label: "schedule-snapshot",
    });
    offerCount = countV2Events(schedule);
    scheduleLabel = `${offerCount} events from ${source}`;
  } else {
    const offersUrl =
      offersExplicit ||
      (offersSource === "s3"
        ? new URL("data/offers-snapshot.json", normalizeBase(base)).toString()
        : null);
    if (!offersUrl && offersSource === "s3") {
      console.error(
        "[verify-s3] OFFERS_SNAPSHOT_SOURCE=s3 but offers URL could not be resolved",
      );
      process.exit(1);
    }
    const { data: offers, source } = await loadJson({
      url: offersUrl,
      localRel: "offers-snapshot.json",
      label: "offers-snapshot",
    });
    offerCount = countV1Offers(offers);
    scheduleLabel = `${offerCount} offers from ${source}`;
  }

  if (offerCount === 0) {
    console.error(`[verify-s3] schedule data empty (${schedulePath})`);
    process.exit(1);
  }
  console.log(`[verify-s3] OK loaded ${scheduleLabel}`);

  if (siteSource === "s3") {
    const manifestOverride = process.env.SITE_SNAPSHOT_MANIFEST_URL?.trim() || null;
    const configUrl = resolveUrl("data/v2/site-config.json", manifestOverride);
    if (!configUrl) {
      console.error("[verify-s3] site-config URL missing");
      process.exit(1);
    }
    const { data: config, source } = await loadJson({
      url: configUrl,
      localRel: "v2/site-config.json",
      label: "site-config",
    });
    if (!config?.navigation?.worldGroups?.length) {
      console.error("[verify-s3] site-config missing navigation.worldGroups");
      process.exit(1);
    }
    console.log(`[verify-s3] OK site-config from ${source}`);

    const mapPath =
      manifest?.snapshots?.map?.path ?? "data/v2/map-snapshot.json";
    const catalogPath =
      manifest?.snapshots?.catalog?.path ?? "data/v2/catalog-snapshot.json";
    const mapUrl = resolveUrl(mapPath, manifestUrl);
    const catalogUrl = resolveUrl(catalogPath, manifestUrl);
    if (!mapUrl || !catalogUrl) {
      console.error("[verify-s3] map or catalog snapshot URL missing");
      process.exit(1);
    }

    const { data: map, source: mapSource } = await loadJson({
      url: mapUrl,
      localRel: mapPath.replace(/^data\//, ""),
      label: "map-snapshot",
    });
    const venueCount = Array.isArray(map?.venues) ? map.venues.length : 0;
    if (venueCount < 1) {
      console.error("[verify-s3] map-snapshot has no venues");
      process.exit(1);
    }
    console.log(`[verify-s3] OK map: ${venueCount} venues from ${mapSource}`);

    const { data: catalog, source: catalogSource } = await loadJson({
      url: catalogUrl,
      localRel: catalogPath.replace(/^data\//, ""),
      label: "catalog-snapshot",
    });
    const worldCount = Array.isArray(catalog?.worlds) ? catalog.worlds.length : 0;
    const courseCount = Array.isArray(catalog?.courses) ? catalog.courses.length : 0;
    if (worldCount < 1 || courseCount < 1) {
      console.error(
        `[verify-s3] catalog-snapshot empty (worlds=${worldCount}, courses=${courseCount})`,
      );
      process.exit(1);
    }
    console.log(
      `[verify-s3] OK catalog: ${worldCount} worlds, ${courseCount} courses from ${catalogSource}`,
    );
  }

  console.log("[verify-s3] all checks passed");
}

main().catch((e) => {
  console.error("[verify-s3]", e.message || e);
  process.exit(1);
});
