import path from "node:path";
import { fileURLToPath } from "node:url";

import { notifyMosSyncFailure } from "./mos-sync-failure-alert.mjs";
import { runMosEnrolledFinalize } from "./mos-enrolled-finalize.mjs";
import { releaseSyncLock } from "./mos-sync-state.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function normalizeEvent(event) {
  if (typeof event === "string") {
    try {
      return JSON.parse(event);
    } catch {
      return {};
    }
  }
  if (event?.body) {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return event ?? {};
}

export async function handler(event = {}) {
  const normalized = normalizeEvent(event);
  process.env.MOS_ENROLLED_SYNC = "1";
  process.env.BM_QUESTHUB_ROOT = __dirname;

  const dryRun =
    normalized.dryRun === true ||
    normalized.dry_run === true ||
    process.env.MOS_ENROLLED_DRY_RUN === "1";

  const runId =
    normalized.runId ||
    normalized.run_id ||
    process.env.MOS_ACTIVE_RUN_ID?.trim();

  if (!runId) {
    return jsonResponse(400, { ok: false, error: "runId required" });
  }

  const logs = [];
  const onProgress = (msg) => {
    console.log(msg);
    logs.push(msg);
  };

  console.log(JSON.stringify({ phase: "finalize_start", runId, dryRun }));

  try {
    const result = await runMosEnrolledFinalize({
      root: __dirname,
      runId,
      dryRun,
      onProgress,
    });

    if (!dryRun && !result.ok && result.errors?.length) {
      await notifyMosSyncFailure({
        kind: "finalize_errors",
        message: `${result.errors.length} URL error(s) in finalize`,
        dryRun: false,
      }).catch(() => {});
    }

    return jsonResponse(result.ok ? 200 : 500, {
      ...result,
      log: logs.slice(-8000).join("\n"),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ phase: "finalize_error", message }));
    return jsonResponse(500, { ok: false, error: message, log: logs.join("\n") });
  } finally {
    if (!dryRun) {
      try {
        await releaseSyncLock();
      } catch (err) {
        console.warn(
          "[mos-finalize] releaseSyncLock:",
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }
}
