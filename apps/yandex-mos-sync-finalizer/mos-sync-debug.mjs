/**
 * Debug logging for mos.ru sync stack.
 * Enable: MOS_SYNC_DEBUG=1 (or MOS_ENROLLED_DEBUG=1)
 */

const DEBUG =
  process.env.MOS_SYNC_DEBUG === "1" ||
  process.env.MOS_ENROLLED_DEBUG === "1";

export function isMosSyncDebug() {
  return DEBUG;
}

/**
 * @param {...unknown} args
 */
export function mosSyncDebug(...args) {
  if (!DEBUG) return;
  console.log("[mos-sync:debug]", ...args);
}

/**
 * @param {...unknown} args
 */
export function mosSyncDebugWarn(...args) {
  if (!DEBUG) return;
  console.warn("[mos-sync:debug]", ...args);
}
