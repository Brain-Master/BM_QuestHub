import fs from "node:fs";
import path from "node:path";

import { writeMosEnrolledConfigFile } from "./mos-enrolled-config.mjs";

/** Gitignored toggle: `make mos-enrolled-sync-on` creates this file. */
export const ENABLED_FILE_REL = "secret/mos-enrolled-sync.enabled";

/**
 * @param {string} root Repo root
 * @returns {{ enabled: boolean, reason: string }}
 */
export function mosEnrolledSyncEnabled(root) {
  const env = process.env.MOS_ENROLLED_SYNC?.trim().toLowerCase();
  if (env === "0" || env === "false" || env === "off" || env === "no") {
    return { enabled: false, reason: "MOS_ENROLLED_SYNC=0" };
  }
  if (env === "1" || env === "true" || env === "on" || env === "yes") {
    return { enabled: true, reason: "MOS_ENROLLED_SYNC=1" };
  }

  const flagPath = path.join(root, ENABLED_FILE_REL);
  if (fs.existsSync(flagPath)) {
    return { enabled: true, reason: ENABLED_FILE_REL };
  }
  return { enabled: false, reason: `no ${ENABLED_FILE_REL} (make mos-enrolled-sync-on)` };
}

/**
 * @param {string} root
 * @param {boolean} on
 */
export function setMosEnrolledSyncEnabled(root, on) {
  const flagPath = path.join(root, ENABLED_FILE_REL);
  if (on) {
    fs.mkdirSync(path.dirname(flagPath), { recursive: true });
    fs.writeFileSync(flagPath, `${new Date().toISOString()}\n`, "utf8");
    writeMosEnrolledConfigFile(root);
  } else if (fs.existsSync(flagPath)) {
    fs.unlinkSync(flagPath);
  }
}
