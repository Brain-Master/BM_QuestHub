import fs from "node:fs";
import path from "node:path";

import { assertYcfS3LibsPresent, isYcfMosSyncLibFile } from "./ycf-s3-lib-files.mjs";

/**
 * Copy scripts/lib MOS modules into a YCF app directory.
 * @param {string} appDir
 * @param {string} root
 * @param {readonly string[]} [extraNames]
 */
export function stageMosLibs(appDir, root, extraNames = []) {
  for (const name of fs.readdirSync(appDir)) {
    if (name.endsWith(".mjs") && name !== "index.js") {
      fs.unlinkSync(path.join(appDir, name));
    }
  }
  const libDir = path.join(root, "scripts", "lib");
  for (const name of fs.readdirSync(libDir)) {
    if (name.endsWith(".test.mjs")) continue;
    if (isYcfMosSyncLibFile(name) || extraNames.includes(name)) {
      fs.copyFileSync(path.join(libDir, name), path.join(appDir, name));
    }
  }
  assertYcfS3LibsPresent(appDir);
}
