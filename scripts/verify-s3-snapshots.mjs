#!/usr/bin/env node
/**
 * Pre-build check: public S3 snapshot URLs respond and contain schedule data.
 * No-op when SITE_SNAPSHOT_SOURCE and OFFERS_SNAPSHOT_SOURCE are not "s3".
 *
 *   node scripts/verify-s3-snapshots.mjs
 */
function normalizeBase(base) {
  return base.endsWith("/") ? base : `${base}/`;
}

function publicBaseUrl() {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  return base && base.length > 0 ? base : null;
}

function resolveUrl(relativePath, manifestUrl) {
  const path = relativePath.replace(/^\//, "");
  if (manifestUrl) {
    try {
      return new URL(path, normalizeBase(manifestUrl)).toString();
    } catch {
      /* fall through */
    }
  }
  const base = publicBaseUrl();
  if (!base) return null;
  try {
    return new URL(path, normalizeBase(base)).toString();
  } catch {
    return null;
  }
}

async function fetchJson(url, label) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status} for ${url}`);
  }
  return res.json();
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
  if (!snapshot || snapshot.version !== 2 || !Array.isArray(snapshot.events)) return 0;
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
  if (manifestUrl) {
    const manifest = await fetchJson(manifestUrl, "manifest");
    if (manifest?.snapshots?.schedule?.path) {
      schedulePath = manifest.snapshots.schedule.path;
    }
    console.log(`[verify-s3] manifest OK: ${manifestUrl}`);
  } else if (siteSource === "s3") {
    console.error("[verify-s3] SITE_SNAPSHOT_SOURCE=s3 but manifest URL missing");
    process.exit(1);
  }

  const offersExplicit = process.env.OFFERS_SNAPSHOT_URL?.trim() || null;
  let offerCount = 0;
  let scheduleLabel = "";

  if (schedulePath.endsWith("schedule-snapshot.json")) {
    const scheduleUrl =
      resolveUrl(schedulePath, manifestUrl) ??
      new URL(schedulePath.replace(/^\//, ""), normalizeBase(base)).toString();
    const schedule = await fetchJson(scheduleUrl, "schedule-snapshot");
    offerCount = countV2Events(schedule);
    scheduleLabel = `${offerCount} events from ${scheduleUrl}`;
  } else {
    const offersUrl =
      offersExplicit ||
      (offersSource === "s3"
        ? new URL("data/offers-snapshot.json", normalizeBase(base)).toString()
        : null);
    if (!offersUrl) {
      console.error(
        "[verify-s3] OFFERS_SNAPSHOT_SOURCE=s3 but offers URL could not be resolved",
      );
      process.exit(1);
    }
    const offers = await fetchJson(offersUrl, "offers-snapshot");
    offerCount = countV1Offers(offers);
    scheduleLabel = `${offerCount} offers from ${offersUrl}`;
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
    const config = await fetchJson(configUrl, "site-config");
    if (!config?.navigation?.worldGroups?.length) {
      console.error("[verify-s3] site-config missing navigation.worldGroups");
      process.exit(1);
    }
    console.log(`[verify-s3] OK site-config from ${configUrl}`);
  }

  console.log("[verify-s3] all checks passed");
}

main().catch((e) => {
  console.error("[verify-s3]", e.message || e);
  process.exit(1);
});
