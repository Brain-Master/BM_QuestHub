#!/usr/bin/env node
/**
 * Encode hero preview MP4 + poster WebP for S3 upload.
 *
 * Usage:
 *   node scripts/encode-hero-video.mjs --slug cyber-rhythm --source path/to/source.mp4
 *   node scripts/encode-hero-video.mjs --slug cyber-rhythm --kind world --source ...
 *
 * Output (under apps/web/media/):
 *   media/quests/<slug>/hero.mp4 + poster.webp
 *   media/worlds/<slug>/hero.mp4 + poster.webp  (--kind world)
 *
 * Then: make s3-sync-media
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA = path.join(ROOT, "apps", "web", "media");

function die(msg) {
  console.error(`[encode-hero-video] ${msg}`);
  process.exit(1);
}

function ffmpegAvailable() {
  const r = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return !r.error && r.status === 0;
}

function runFfmpeg(args) {
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.error) die(`ffmpeg failed: ${r.error.message}`);
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function parseArgs(argv) {
  let slug = "";
  let source = "";
  let kind = "quest";
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--slug" && argv[i + 1]) slug = argv[++i];
    else if (argv[i] === "--source" && argv[i + 1]) source = argv[++i];
    else if (argv[i] === "--kind" && argv[i + 1]) kind = argv[++i];
  }
  if (!slug || !source) {
    die("Usage: node scripts/encode-hero-video.mjs --slug <slug> --source <file.mp4> [--kind quest|world]");
  }
  if (kind !== "quest" && kind !== "world") die("--kind must be quest or world");
  return { slug, source: path.resolve(source), kind };
}

function main() {
  if (!ffmpegAvailable()) {
    die("ffmpeg not found in PATH — install ffmpeg to encode hero videos");
  }

  const { slug, source, kind } = parseArgs(process.argv);
  if (!fs.existsSync(source)) die(`source not found: ${source}`);

  const subdir = kind === "world" ? `worlds/${slug}` : `quests/${slug}`;
  const outDir = path.join(MEDIA, subdir);
  fs.mkdirSync(outDir, { recursive: true });

  const heroMp4 = path.join(outDir, "hero.mp4");
  const posterWebp = path.join(outDir, "poster.webp");

  console.log(`[encode-hero-video] ${source} → ${heroMp4}`);
  runFfmpeg([
    "-y",
    "-i",
    source,
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

  console.log(`[encode-hero-video] poster → ${posterWebp}`);
  runFfmpeg([
    "-y",
    "-i",
    heroMp4,
    "-ss",
    "00:00:01",
    "-vframes",
    "1",
    "-vf",
    "scale=1280:-2",
    posterWebp,
  ]);

  const stat = fs.statSync(heroMp4);
  const mb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`[encode-hero-video] done (${mb} MB). Run: make s3-sync-media`);
  console.log(`  Public URL: {NEXT_PUBLIC_S3_PUBLIC_BASE_URL}/media/${subdir}/hero.mp4`);
}

main();
