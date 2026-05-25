import { readOpsJson, writeOpsJson } from "./mos-ops-s3.mjs";

/**
 * @param {string} runId
 */
export function runPrefix(runId) {
  return `ops/mos-sync-runs/${runId}`;
}

/**
 * @param {string} runId
 */
export function manifestKey(runId) {
  return `${runPrefix(runId)}/manifest.json`;
}

/**
 * @param {string} runId
 * @param {number} batchIndex
 */
export function batchResultKey(runId, batchIndex) {
  const n = String(batchIndex).padStart(3, "0");
  return `${runPrefix(runId)}/batch-${n}.json`;
}

/**
 * @param {string} runId
 */
export async function readRunManifest(runId) {
  const stored = await readOpsJson(manifestKey(runId));
  return stored?.data ?? null;
}

/**
 * @param {string} runId
 * @param {unknown} manifest
 */
export async function writeRunManifest(runId, manifest) {
  return writeOpsJson(manifestKey(runId), manifest);
}

/**
 * @param {string} runId
 * @param {number} batchIndex
 */
export async function readBatchResult(runId, batchIndex) {
  const stored = await readOpsJson(batchResultKey(runId, batchIndex));
  return stored?.data ?? null;
}

/**
 * @param {string} runId
 * @param {number} batchIndex
 * @param {unknown} payload
 */
export async function writeBatchResult(runId, batchIndex, payload) {
  return writeOpsJson(batchResultKey(runId, batchIndex), payload);
}

/**
 * @param {string} runId
 * @param {number} batchesTotal
 */
export async function listBatchResultKeys(runId, batchesTotal) {
  const keys = [];
  for (let i = 0; i < batchesTotal; i++) {
    keys.push(batchResultKey(runId, i));
  }
  return keys;
}
