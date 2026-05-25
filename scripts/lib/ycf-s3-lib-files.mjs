import fs from "node:fs";
import path from "node:path";

/** Lib .mjs files required whenever mos-ops-s3.mjs is bundled into YCF. */
export const YCF_S3_LIB_FILES = ["mos-ops-s3.mjs", "s3-storage.mjs"];

/**
 * @param {string} name
 */
export function isYcfMosSyncLibFile(name) {
  return (
    name.endsWith(".mjs") &&
    !name.endsWith(".test.mjs") &&
    (name.startsWith("mos-") ||
      name.startsWith("mos-ops-") ||
      name.startsWith("mos-sync-") ||
      name.startsWith("schedule-traffic") ||
      name.startsWith("trigger-sheet") ||
      name === "telegram-alert.mjs" ||
      name === "s3-storage.mjs")
  );
}

/**
 * @param {string} appDir
 */
export function assertYcfS3LibsPresent(appDir) {
  for (const name of YCF_S3_LIB_FILES) {
    if (!fs.existsSync(path.join(appDir, name))) {
      throw new Error(
        `[ycf-bundle] missing ${name} in ${appDir} — add to copyLibs/stageBundle (see ycf-s3-lib-files.mjs)`,
      );
    }
  }
}
