import sharp from "sharp";

import type { MediaPreset } from "./media-presets";

function targetSize(preset: MediaPreset): { width: number; height: number } {
  const { w, h } = preset.aspectRatio;
  const ratio = w / h;
  let width = preset.maxWidth;
  let height = Math.round(width / ratio);
  if (height > preset.maxHeight) {
    height = preset.maxHeight;
    width = Math.round(height * ratio);
  }
  return { width, height };
}

/**
 * Resize and encode image to WebP per ingest preset.
 */
export async function processImageWithPreset(
  buffer: Buffer,
  preset: MediaPreset,
): Promise<Buffer> {
  const { width, height } = targetSize(preset);
  const pipeline = sharp(buffer, { failOn: "none" }).rotate();

  if (preset.fit === "cover") {
    return pipeline
      .resize(width, height, { fit: "cover", position: "centre" })
      .webp({ quality: preset.quality ?? 82 })
      .toBuffer();
  }

  return pipeline
    .resize(width, height, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .webp({ quality: preset.quality ?? 80 })
    .toBuffer();
}
