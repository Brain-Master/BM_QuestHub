import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SESSION = "02fd8a";
const ENDPOINT =
  "http://127.0.0.1:7485/ingest/ba25c04a-4952-4f6b-ae4e-ffc00bcdf276";
const LOG_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "debug-02fd8a.log",
);

/**
 * Debug trace for mos sync (console in YCF + optional local NDJSON).
 * @param {string} hypothesisId
 * @param {string} location
 * @param {string} message
 * @param {Record<string, unknown>} [data]
 */
export function mosSyncTrace(hypothesisId, location, message, data = {}) {
  const entry = {
    sessionId: SESSION,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  console.log("[DEBUG-02fd8a]", JSON.stringify(entry));
  if (process.env.BM_DEBUG_INGEST === "1") {
    try {
      fs.appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`);
    } catch {
      /* ignore */
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": SESSION,
      },
      body: JSON.stringify(entry),
    }).catch(() => {});
  }
  // #endregion
}
