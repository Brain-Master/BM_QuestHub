import path from "node:path";
import { fileURLToPath } from "node:url";

import { processUrlBatch } from "./mos-enrolled-batch.mjs";
import { notifyMosSyncFailure } from "./mos-sync-failure-alert.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

/**
 * @param {unknown} event
 * @returns {unknown[]}
 */
function ymqMessages(event) {
  if (Array.isArray(event?.messages)) return event.messages;
  if (Array.isArray(event?.Records)) return event.Records;
  return [];
}

/**
 * @param {unknown} record
 */
function parseMessageBody(record) {
  if (record?.details?.message?.body) {
    return JSON.parse(record.details.message.body);
  }
  const raw = record?.body ?? record?.message?.body;
  if (typeof raw === "string") return JSON.parse(raw);
  return record ?? {};
}

export async function handler(event = {}) {
  process.env.MOS_ENROLLED_SYNC = "1";
  process.env.BM_QUESTHUB_ROOT = __dirname;

  const records = ymqMessages(event);
  const results = [];

  try {
    for (const record of records) {
      const body = parseMessageBody(record);
      const { runId, batchIndex, urls } = body;
      if (!runId || batchIndex === undefined || !Array.isArray(urls)) {
        console.warn("[mos-worker] skip invalid message", body);
        continue;
      }
      console.log(
        JSON.stringify({ phase: "batch_start", runId, batchIndex, urls: urls.length }),
      );
      const result = await processUrlBatch({
        runId,
        batchIndex,
        urls,
        root: __dirname,
        dryRun: false,
        onProgress: (msg) => console.log(msg),
      });
      results.push(result);
    }

    if (records.length === 0) {
      return jsonResponse(400, { ok: false, error: "no YMQ messages in event" });
    }

    const ok = results.every((r) => r.ok !== false);
    return jsonResponse(ok ? 200 : 500, { ok, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mos-worker] unhandled error:", message);
    try {
      await notifyMosSyncFailure({
        kind: "worker_timeout",
        message: `url-worker failed: ${message}`,
        dryRun: false,
      });
    } catch {
      /* optional */
    }
    throw err;
  }
}
