import fs from "node:fs";
import path from "node:path";

/** Gitignored settings next to the enable flag. */
export const CONFIG_FILE_REL = "secret/mos-enrolled-sync.config.json";

/** @typedef {Object} MosEnrolledConfig
 * @property {number} intervalMinutes
 * @property {number} urlDelayMs
 * @property {number} fetchTimeoutMs
 * @property {boolean} autoPublish
 */

export const DEFAULT_MOS_ENROLLED_CONFIG = {
  intervalMinutes: 15,
  urlDelayMs: 400,
  fetchTimeoutMs: 25_000,
  autoPublish: false,
};

/**
 * @param {unknown} value
 * @param {number} fallback
 */
function positiveInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.round(n);
}

/**
 * @param {string} root
 * @returns {MosEnrolledConfig}
 */
export function readMosEnrolledConfigFile(root) {
  const filePath = path.join(root, CONFIG_FILE_REL);
  if (!fs.existsSync(filePath)) {
    return { ...DEFAULT_MOS_ENROLLED_CONFIG };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      intervalMinutes: positiveInt(
        raw.intervalMinutes,
        DEFAULT_MOS_ENROLLED_CONFIG.intervalMinutes,
      ),
      urlDelayMs: positiveInt(raw.urlDelayMs, DEFAULT_MOS_ENROLLED_CONFIG.urlDelayMs),
      fetchTimeoutMs: positiveInt(
        raw.fetchTimeoutMs,
        DEFAULT_MOS_ENROLLED_CONFIG.fetchTimeoutMs,
      ),
      autoPublish: Boolean(raw.autoPublish),
    };
  } catch {
    return { ...DEFAULT_MOS_ENROLLED_CONFIG };
  }
}

/**
 * Apply config file defaults (env vars win if already set).
 * @param {string} root
 * @returns {MosEnrolledConfig}
 */
export function applyMosEnrolledConfig(root) {
  const cfg = readMosEnrolledConfigFile(root);

  if (!process.env.MOS_ENROLLED_INTERVAL_MINUTES?.trim()) {
    process.env.MOS_ENROLLED_INTERVAL_MINUTES = String(cfg.intervalMinutes);
  }
  if (!process.env.MOS_ENROLLED_URL_DELAY_MS?.trim()) {
    process.env.MOS_ENROLLED_URL_DELAY_MS = String(cfg.urlDelayMs);
  }
  if (!process.env.MOS_ENROLLED_FETCH_TIMEOUT_MS?.trim()) {
    process.env.MOS_ENROLLED_FETCH_TIMEOUT_MS = String(cfg.fetchTimeoutMs);
  }
  if (
    !process.env.MOS_ENROLLED_AUTO_PUBLISH?.trim() &&
    cfg.autoPublish
  ) {
    process.env.MOS_ENROLLED_AUTO_PUBLISH = "1";
  }

  return {
    intervalMinutes: positiveInt(
      process.env.MOS_ENROLLED_INTERVAL_MINUTES,
      cfg.intervalMinutes,
    ),
    urlDelayMs: positiveInt(process.env.MOS_ENROLLED_URL_DELAY_MS, cfg.urlDelayMs),
    fetchTimeoutMs: positiveInt(
      process.env.MOS_ENROLLED_FETCH_TIMEOUT_MS,
      cfg.fetchTimeoutMs,
    ),
    autoPublish:
      process.env.MOS_ENROLLED_AUTO_PUBLISH === "1" || cfg.autoPublish,
  };
}

/**
 * @param {string} root
 * @param {Partial<MosEnrolledConfig>} [patch]
 */
export function writeMosEnrolledConfigFile(root, patch = {}) {
  const filePath = path.join(root, CONFIG_FILE_REL);
  const current = readMosEnrolledConfigFile(root);
  const next = {
    intervalMinutes: positiveInt(
      patch.intervalMinutes ?? current.intervalMinutes,
      DEFAULT_MOS_ENROLLED_CONFIG.intervalMinutes,
    ),
    urlDelayMs: positiveInt(
      patch.urlDelayMs ?? current.urlDelayMs,
      DEFAULT_MOS_ENROLLED_CONFIG.urlDelayMs,
    ),
    fetchTimeoutMs: positiveInt(
      patch.fetchTimeoutMs ?? current.fetchTimeoutMs,
      DEFAULT_MOS_ENROLLED_CONFIG.fetchTimeoutMs,
    ),
    autoPublish:
      patch.autoPublish !== undefined
        ? Boolean(patch.autoPublish)
        : current.autoPublish,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

/**
 * @param {MosEnrolledConfig} cfg
 */
export function formatMosEnrolledConfig(cfg) {
  return [
    `intervalMinutes=${cfg.intervalMinutes}`,
    `urlDelayMs=${cfg.urlDelayMs}`,
    `fetchTimeoutMs=${cfg.fetchTimeoutMs}`,
    `autoPublish=${cfg.autoPublish}`,
  ].join(", ");
}
