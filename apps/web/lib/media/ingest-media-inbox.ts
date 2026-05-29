import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { ColdSnapshotBundle } from "@/lib/content/sync-cold-core";
import type { OffersSnapshotV1 } from "@/lib/offers/snapshot-types";
import type { ScheduleCard } from "@/lib/schemas";

import {
  INBOX_SLOTS,
  QUEST_VIDEO_INBOX,
  VENUE_LANDING_VIDEO_INBOX,
  schoolLandingScopeSlugs,
  slotsForEntity,
  slotsForSchoolLandingScope,
  type MediaInboxContext,
} from "./design-pack-slots";
import { isPlaceholderInboxBytes } from "./inbox-placeholder";
import {
  canonicalMediaUrl,
  diskPathFromPattern,
  findInboxSourceFile,
  mediaInboxRoot,
  mediaOutputRoot,
  shiftGroupIdToInboxDir,
} from "./inbox-paths";
import {
  readMediaIngestManifest,
  sha256Buffer,
  shouldSkipIngest,
  writeMediaIngestManifest,
  type MediaIngestManifest,
} from "./manifest";
import { MEDIA_PRESETS, type MediaPresetId } from "./media-presets";
import { processImageWithPreset } from "./process-image";

function sha256Json(value: unknown): string {
  const raw = JSON.stringify(value);
  return `sha256:${crypto.createHash("sha256").update(raw, "utf8").digest("hex")}`;
}

/** Hot sync stores shift group in offer id: `sheet:{shiftGroupId}`. */
function loadQuestHeroBySlug(webRoot: string): Map<string, string | undefined> {
  const catalogPath = path.join(webRoot, "data/v2/catalog-snapshot.json");
  if (!fs.existsSync(catalogPath)) return new Map();
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
    courses?: Array<{ slug: string; heroImageUrl?: string }>;
  };
  return new Map(
    (catalog.courses ?? []).map((c) => [c.slug, c.heroImageUrl?.trim() || undefined]),
  );
}

function shiftGroupIdFromOfferId(id: string): string | undefined {
  const prefix = "sheet:";
  if (!id.startsWith(prefix)) return undefined;
  const rest = id.slice(prefix.length);
  return rest.length > 0 ? rest : undefined;
}

function ffmpegAvailable(): boolean {
  const r = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return !r.error && r.status === 0;
}

async function ingestImageFromFile(options: {
  manifest: MediaIngestManifest;
  manifestKey: string;
  sourcePath: string;
  webRoot: string;
  presetId: MediaPresetId;
  outputVars: Record<string, string>;
  placeholderFile?: string;
  caption?: string;
}): Promise<{ publicUrl?: string; skipped: boolean }> {
  const preset = MEDIA_PRESETS[options.presetId];
  const diskPath = diskPathFromPattern(
    options.webRoot,
    preset.outputPattern,
    options.outputVars,
  );
  const publicUrl = canonicalMediaUrl(preset.outputPattern, options.outputVars);
  const buffer = fs.readFileSync(options.sourcePath);
  const hash = sha256Buffer(buffer);
  const sourceKey = path.relative(mediaInboxRoot(options.webRoot), options.sourcePath);

  if (
    options.placeholderFile &&
    isPlaceholderInboxBytes(options.webRoot, buffer, options.placeholderFile)
  ) {
    console.warn(`[ingest-inbox] skip placeholder source: ${sourceKey}`);
    const cachedOutput = options.manifest.entries[options.manifestKey]?.output;
    if (cachedOutput && fs.existsSync(path.join(options.webRoot, cachedOutput))) {
      return { publicUrl: cachedOutput, skipped: true };
    }
    if (fs.existsSync(diskPath)) {
      return { publicUrl, skipped: true };
    }
    return { skipped: true };
  }

  if (shouldSkipIngest(options.manifest, options.manifestKey, sourceKey, hash) && fs.existsSync(diskPath)) {
    return { publicUrl, skipped: true };
  }

  const processed = await processImageWithPreset(buffer, preset);
  fs.mkdirSync(path.dirname(diskPath), { recursive: true });
  fs.writeFileSync(diskPath, processed);

  options.manifest.entries[options.manifestKey] = {
    sourceUrl: sourceKey,
    sha256: hash,
    output: publicUrl,
    updatedAt: new Date().toISOString(),
    ...(options.caption ? { caption: options.caption } : {}),
  };

  return { publicUrl, skipped: false };
}

function ingestQuestVideo(
  webRoot: string,
  slug: string,
  manifest: MediaIngestManifest,
): { fileUrl?: string; posterUrl?: string } {
  const inboxDir = path.join(mediaInboxRoot(webRoot), "quests", slug);
  const sourceMp4 = path.join(inboxDir, QUEST_VIDEO_INBOX.sourceFilename);
  if (!fs.existsSync(sourceMp4)) return {};

  if (!ffmpegAvailable()) {
    console.warn(`[ingest-inbox] ffmpeg missing — skip quest video ${slug}`);
    return {};
  }

  const outDir = path.join(mediaOutputRoot(webRoot), "quests", slug);
  fs.mkdirSync(outDir, { recursive: true });
  const heroMp4 = path.join(outDir, "hero.mp4");
  const posterWebp = path.join(outDir, "poster.webp");

  const run = (args: string[]) => {
    const r = spawnSync("ffmpeg", args, { stdio: "pipe" });
    if (r.status !== 0) {
      throw new Error(r.stderr?.toString() || "ffmpeg failed");
    }
  };

  run([
    "-y",
    "-i",
    sourceMp4,
    "-t",
    "45",
    "-vf",
    "scale=-2:720:force_original_aspect_ratio=decrease",
    "-c:v",
    "libx264",
    "-crf",
    "28",
    "-preset",
    "slow",
    "-an",
    "-movflags",
    "+faststart",
    heroMp4,
  ]);
  run(["-y", "-i", heroMp4, "-ss", "00:00:01", "-vframes", "1", "-vf", "scale=1280:-2", posterWebp]);

  const fileUrl = canonicalMediaUrl("media/quests/{slug}/hero.mp4", { slug });
  const posterUrl = canonicalMediaUrl("media/quests/{slug}/poster.webp", { slug });
  manifest.entries[`quest:${slug}:video`] = {
    sourceUrl: path.relative(mediaInboxRoot(webRoot), sourceMp4),
    sha256: sha256Buffer(fs.readFileSync(sourceMp4)),
    output: fileUrl,
    updatedAt: new Date().toISOString(),
  };

  return { fileUrl, posterUrl };
}

function readGalleryCaption(sourcePath: string): string | undefined {
  const dir = path.dirname(sourcePath);
  const base = path.basename(sourcePath).replace(/\.source\.(jpe?g|png|webp)$/i, "");
  const captionPath = path.join(dir, `${base}.caption.txt`);
  if (!fs.existsSync(captionPath)) return undefined;
  const text = fs.readFileSync(captionPath, "utf8").trim();
  return text || undefined;
}

function ingestVenueLandingVideo(
  webRoot: string,
  scope: string,
  manifest: MediaIngestManifest,
): string | undefined {
  const inboxDir = path.join(mediaInboxRoot(webRoot), "venues", scope);
  const sourceMp4 = path.join(inboxDir, VENUE_LANDING_VIDEO_INBOX.sourceFilename);
  if (!fs.existsSync(sourceMp4)) return undefined;

  const manifestKey = `venue-landing:${scope}:video`;
  const fileUrl = canonicalMediaUrl("media/venues/{scope}/landing-30s.mp4", { scope });
  const outDir = path.join(mediaOutputRoot(webRoot), "venues", scope);
  const landingMp4 = path.join(outDir, "landing-30s.mp4");
  const hash = sha256Buffer(fs.readFileSync(sourceMp4));
  const sourceKey = path.relative(mediaInboxRoot(webRoot), sourceMp4);

  if (
    shouldSkipIngest(manifest, manifestKey, sourceKey, hash) &&
    fs.existsSync(landingMp4)
  ) {
    return fileUrl;
  }

  if (!ffmpegAvailable()) {
    console.warn(`[ingest-inbox] ffmpeg missing — skip venue landing video ${scope}`);
    return undefined;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const run = (args: string[]) => {
    const r = spawnSync("ffmpeg", args, { stdio: "pipe" });
    if (r.status !== 0) {
      throw new Error(r.stderr?.toString() || "ffmpeg failed");
    }
  };

  run([
    "-y",
    "-i",
    sourceMp4,
    "-t",
    "30",
    "-vf",
    "scale=-2:720:force_original_aspect_ratio=decrease",
    "-c:v",
    "libx264",
    "-crf",
    "28",
    "-preset",
    "slow",
    "-an",
    "-movflags",
    "+faststart",
    landingMp4,
  ]);

  manifest.entries[manifestKey] = {
    sourceUrl: sourceKey,
    sha256: hash,
    output: fileUrl,
    updatedAt: new Date().toISOString(),
  };

  return fileUrl;
}

export async function ingestVenueSchoolLandingMedia(
  webRoot: string,
  context: MediaInboxContext,
  manifest: MediaIngestManifest,
  result: IngestMediaFromInboxResult,
): Promise<void> {
  for (const scope of schoolLandingScopeSlugs(context)) {
    try {
      ingestVenueLandingVideo(webRoot, scope, manifest);
    } catch (e) {
      result.errors.push(`venue-landing ${scope}/video: ${formatErr(e)}`);
    }

    for (const slot of slotsForSchoolLandingScope(scope)) {
      const source = findInboxSourceFile(webRoot, slot.inboxDir, slot.sourceFilename);
      if (!source) continue;

      try {
        if (slot.presetId === "venue_landing_poster") {
          const { skipped } = await ingestImageFromFile({
            manifest,
            manifestKey: `venue-landing:${scope}:poster`,
            sourcePath: source,
            webRoot,
            presetId: slot.presetId,
            outputVars: { scope },
            placeholderFile: slot.placeholderFile,
          });
          if (skipped) result.imagesSkipped += 1;
          else result.imagesProcessed += 1;
          continue;
        }

        const index = slot.galleryIndex ?? "01";
        const caption = readGalleryCaption(source);
        const { skipped } = await ingestImageFromFile({
          manifest,
          manifestKey: `venue-activity:${scope}:${index}`,
          sourcePath: source,
          webRoot,
          presetId: "venue_activity_gallery",
          outputVars: { scope, index },
          placeholderFile: slot.placeholderFile,
          caption,
        });
        if (skipped) result.imagesSkipped += 1;
        else result.imagesProcessed += 1;
      } catch (e) {
        result.errors.push(`venue-landing ${scope}/${slot.id}: ${formatErr(e)}`);
      }
    }
  }
}

export type IngestMediaFromInboxOptions = {
  webRoot: string;
  context: MediaInboxContext;
  coldBundle?: ColdSnapshotBundle;
  hotSnapshot?: OffersSnapshotV1;
};

export type IngestMediaFromInboxResult = {
  imagesProcessed: number;
  imagesSkipped: number;
  errors: string[];
};

function pruneManifestPlaceholderHashes(webRoot: string, manifest: MediaIngestManifest): number {
  const placeholderHashes = new Set<string>();
  for (const slot of INBOX_SLOTS) {
    if (!slot.placeholderFile) continue;
    const phPath = path.join(webRoot, "media", "placeholders", slot.placeholderFile);
    if (!fs.existsSync(phPath)) continue;
    placeholderHashes.add(sha256Buffer(fs.readFileSync(phPath)));
  }
  let removed = 0;
  for (const [key, entry] of Object.entries(manifest.entries)) {
    if (entry.sha256 && placeholderHashes.has(entry.sha256)) {
      delete manifest.entries[key];
      removed += 1;
    }
  }
  return removed;
}

export async function ingestMediaFromInbox(
  options: IngestMediaFromInboxOptions,
): Promise<IngestMediaFromInboxResult> {
  const manifest = readMediaIngestManifest(options.webRoot);
  const pruned = pruneManifestPlaceholderHashes(options.webRoot, manifest);
  if (pruned > 0) {
    console.log(`[ingest-inbox] pruned ${pruned} placeholder manifest entry(ies)`);
  }
  const result: IngestMediaFromInboxResult = {
    imagesProcessed: 0,
    imagesSkipped: 0,
    errors: [],
  };

  const { webRoot, context, coldBundle, hotSnapshot } = options;

  if (coldBundle) {
    const worldBySlug = new Map(coldBundle.catalog.worlds.map((w) => [w.slug, w]));
    const courseBySlug = new Map(coldBundle.catalog.courses.map((c) => [c.slug, c]));
    const venues = coldBundle.map.venues;
    const venueBySlug = new Map(venues.map((v) => [v.slug, v]));

    function applyLogoToScope(scopeSlug: string, logoUrl: string) {
      for (const v of venues) {
        if ((v.schoolScopeSlug || v.slug) === scopeSlug) {
          v.logoUrl = logoUrl;
        }
      }
    }

    for (const slug of context.worldSlugs) {
      const world = worldBySlug.get(slug);
      if (!world) continue;
      for (const slot of slotsForEntity("world", slug)) {
        const source = findInboxSourceFile(webRoot, slot.inboxDir, slot.sourceFilename);
        if (!source) continue;
        try {
          const { publicUrl, skipped } = await ingestImageFromFile({
            manifest,
            manifestKey: `world:${slug}:${slot.id}`,
            sourcePath: source,
            webRoot,
            presetId: slot.presetId,
            outputVars: { slug },
            placeholderFile: slot.placeholderFile,
          });
          world.heroImageUrl = publicUrl;
          if (skipped) result.imagesSkipped += 1;
          else result.imagesProcessed += 1;
        } catch (e) {
          result.errors.push(`world ${slug}/${slot.id}: ${formatErr(e)}`);
        }
      }
    }

    for (const slug of context.questSlugs) {
      const course = courseBySlug.get(slug);
      if (!course) continue;
      for (const slot of slotsForEntity("quest", slug)) {
        const source = findInboxSourceFile(webRoot, slot.inboxDir, slot.sourceFilename);
        if (!source) continue;
        try {
          const { publicUrl, skipped } = await ingestImageFromFile({
            manifest,
            manifestKey: `quest:${slug}:${slot.id}`,
            sourcePath: source,
            webRoot,
            presetId: slot.presetId,
            outputVars: { slug },
            placeholderFile: slot.placeholderFile,
          });
          if (slot.presetId === "course_catalog_image") {
            course.catalogImageUrl = publicUrl;
          } else if (slot.presetId === "course_hero_image") {
            course.heroImageUrl = publicUrl;
          }
          if (skipped) result.imagesSkipped += 1;
          else result.imagesProcessed += 1;
        } catch (e) {
          result.errors.push(`quest ${slug}/${slot.id}: ${formatErr(e)}`);
        }
      }
      try {
        const video = ingestQuestVideo(webRoot, slug, manifest);
        if (video.fileUrl) course.heroVideoFileUrl = video.fileUrl;
      } catch (e) {
        result.errors.push(`quest ${slug}/video: ${formatErr(e)}`);
      }
    }

    for (const ref of context.venues) {
      const venue = venueBySlug.get(ref.venueSlug);
      if (!venue) continue;
      for (const slot of slotsForEntity("venue", ref.scopeSlug)) {
        const source = findInboxSourceFile(webRoot, slot.inboxDir, slot.sourceFilename);
        if (!source) continue;
        const photoIndex = slot.sourceFilename.match(/photo-(\d+)/)?.[1] ?? "1";
        try {
          if (slot.presetId === "venue_logo") {
            const { publicUrl, skipped } = await ingestImageFromFile({
              manifest,
              manifestKey: `venue:${ref.scopeSlug}:logo`,
              sourcePath: source,
              webRoot,
              presetId: "venue_logo",
              outputVars: { slug: ref.scopeSlug },
              placeholderFile: slot.placeholderFile,
            });
            if (publicUrl) {
              applyLogoToScope(ref.scopeSlug, publicUrl);
            }
            if (skipped) result.imagesSkipped += 1;
            else result.imagesProcessed += 1;
          } else {
            const { publicUrl, skipped } = await ingestImageFromFile({
              manifest,
              manifestKey: `venue:${ref.venueSlug}:photo:${photoIndex}`,
              sourcePath: source,
              webRoot,
              presetId: "venue_photo",
              outputVars: { slug: ref.venueSlug, index: photoIndex },
              placeholderFile: slot.placeholderFile,
            });
            if (!publicUrl) {
              if (skipped) result.imagesSkipped += 1;
              continue;
            }
            const photos = [...(venue.photos ?? [])];
            const idx = Number(photoIndex) - 1;
            while (photos.length <= idx) photos.push({ url: publicUrl });
            photos[idx] = { url: publicUrl, alt: venue.name };
            venue.photos = photos.filter((p) => p.url);
            if (skipped) result.imagesSkipped += 1;
            else result.imagesProcessed += 1;
          }
        } catch (e) {
          result.errors.push(`venue ${ref.scopeSlug}/${slot.id}: ${formatErr(e)}`);
        }
      }
    }

    const catalogBody = {
      worlds: coldBundle.catalog.worlds,
      courses: coldBundle.catalog.courses,
    };
    coldBundle.catalog.integrity.contentHash = sha256Json(catalogBody);
    const mapBody = { venues: coldBundle.map.venues };
    coldBundle.map.integrity.contentHash = sha256Json(mapBody);
    for (const detail of coldBundle.details) {
      const course = courseBySlug.get(detail.slug);
      if (course) detail.course = { ...course };
    }
  }

  if (hotSnapshot) {
    const questHeroBySlug = loadQuestHeroBySlug(webRoot);

    for (const questKey of Object.keys(hotSnapshot.offersByQuest)) {
      const offers = hotSnapshot.offersByQuest[questKey] ?? [];
      const questHeroUrl = questHeroBySlug.get(questKey);

      for (const offer of offers) {
        const shiftId = shiftGroupIdFromOfferId(offer.id);
        if (!shiftId || !context.shiftGroupIds.includes(shiftId)) continue;

        let heroUrl: string | undefined;
        let compactUrl: string | undefined;

        for (const slot of slotsForEntity("schedule", shiftId)) {
          const source = findInboxSourceFile(webRoot, slot.inboxDir, slot.sourceFilename);
          if (!source) continue;
          try {
            const mediaShiftKey = shiftGroupIdToInboxDir(shiftId);
            const { publicUrl, skipped } = await ingestImageFromFile({
              manifest,
              manifestKey: `schedule:${shiftId}:${slot.id}`,
              sourcePath: source,
              webRoot,
              presetId: slot.presetId,
              outputVars: { shiftGroupId: mediaShiftKey },
              placeholderFile: slot.placeholderFile,
            });
            if (publicUrl) {
              if (slot.presetId === "schedule_card_hero") heroUrl = publicUrl;
              if (slot.presetId === "schedule_card_compact") compactUrl = publicUrl;
            }
            if (skipped) result.imagesSkipped += 1;
            else result.imagesProcessed += 1;
          } catch (e) {
            result.errors.push(`schedule ${shiftId}/${slot.id}: ${formatErr(e)}`);
          }
        }

        if (!offer.scheduleCard) continue;
        const alt =
          offer.scheduleCard.displayTitle ??
          offer.scheduleCard.programNameH2 ??
          offer.scheduleCard.programNameH1 ??
          questKey;
        const questImage = questHeroUrl ? { url: questHeroUrl, alt } : undefined;
        const hero = heroUrl ? { url: heroUrl, alt } : questImage;
        const compact = compactUrl
          ? { url: compactUrl, alt }
          : hero ?? questImage;
        if (!hero && !compact) continue;

        const media: NonNullable<ScheduleCard["media"]> = {
          ...(offer.scheduleCard.media ?? {}),
        };
        if (hero) media.hero = hero;
        if (compact) media.compact = compact;
        offer.scheduleCard = { ...offer.scheduleCard, media };
      }
    }
  }

  await ingestVenueSchoolLandingMedia(webRoot, context, manifest, result);

  writeMediaIngestManifest(webRoot, manifest);

  if (result.errors.length > 0) {
    console.warn(
      `[ingest-inbox] ${result.errors.length} error(s):\n${result.errors.slice(0, 8).join("\n")}`,
    );
  }
  console.log(
    `[ingest-inbox] images: ${result.imagesProcessed} new, ${result.imagesSkipped} skipped`,
  );

  return result;
}

function formatErr(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function venueInboxRefsFromBundle(
  venues: ColdSnapshotBundle["map"]["venues"],
): MediaInboxContext["venues"] {
  return venues.map((v) => ({
    scopeSlug: v.schoolScopeSlug || v.slug,
    venueSlug: v.slug,
  }));
}

export function buildMediaInboxContext(input: {
  coldBundle?: ColdSnapshotBundle;
  hotSnapshot?: OffersSnapshotV1;
}): MediaInboxContext {
  const questSlugs = new Set<string>();
  const worldSlugs = new Set<string>();
  const shiftGroupIds = new Set<string>();
  let venues: MediaInboxContext["venues"] = [];

  if (input.coldBundle) {
    for (const c of input.coldBundle.catalog.courses) questSlugs.add(c.slug);
    for (const w of input.coldBundle.catalog.worlds) worldSlugs.add(w.slug);
    venues = venueInboxRefsFromBundle(input.coldBundle.map.venues);
  }

  if (input.hotSnapshot) {
    for (const [questKey, offers] of Object.entries(input.hotSnapshot.offersByQuest)) {
      questSlugs.add(questKey);
      for (const o of offers) {
        const shiftId = shiftGroupIdFromOfferId(o.id);
        if (shiftId) shiftGroupIds.add(shiftId);
      }
    }
  }

  return {
    questSlugs: [...questSlugs],
    worldSlugs: [...worldSlugs],
    venues,
    shiftGroupIds: [...shiftGroupIds],
  };
}
