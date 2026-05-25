import path from "node:path";
import { fileURLToPath } from "node:url";

import { notifyMosSyncFailure } from "./mos-sync-failure-alert.mjs";
import { syncMosEnrolledFromPortal } from "./mos-enrolled-sync.mjs";
import { releaseSyncLock } from "./mos-sync-state.mjs";
import { mosSyncTrace } from "./mos-sync-trace.mjs";
import { triggerSheetSyncHot } from "./trigger-sheet-sync-hot.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function autoPublishEnabled() {
  return process.env.MOS_ENROLLED_AUTO_PUBLISH === "1";
}

/** HTTP / async invoke may pass raw JSON string as event. */
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

/**
 * @param {{ kind: string, message: string, detail?: string, dryRun?: boolean }} payload
 */
async function alertSyncFailure(payload) {
  try {
    await notifyMosSyncFailure(payload);
  } catch (err) {
    console.warn(
      "[mos-enrolled] failure alert:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function handler(event = {}) {
  const normalized = normalizeEvent(event);
  process.env.MOS_ENROLLED_SYNC = "1";
  process.env.BM_QUESTHUB_ROOT = __dirname;

  const dryRun =
    normalized.dryRun === true ||
    normalized.dry_run === true ||
    process.env.MOS_ENROLLED_DRY_RUN === "1";

  const logs = [];
  const onProgress = (msg) => {
    console.log(msg);
    logs.push(msg);
  };

  const handlerStartedAt = Date.now();
  mosSyncTrace("H4", "index.js:handler", "sync handler start", {
    dryRun,
    source: normalized.source ?? "invoke",
  });
  console.log(
    JSON.stringify({
      phase: "sync_start",
      dryRun,
      source: normalized.source ?? "invoke",
      autoPublish: autoPublishEnabled(),
    }),
  );

  let failureAlerted = false;
  const alertOnce = async (payload) => {
    if (failureAlerted) return;
    failureAlerted = true;
    await alertSyncFailure({ ...payload, dryRun });
  };

  try {
    const result = await syncMosEnrolledFromPortal({
      root: __dirname,
      dryRun,
      force: dryRun || process.env.MOS_ENROLLED_FORCE === "1",
      onProgress,
    });

    if (result.skipped) {
      console.log(JSON.stringify({ phase: "sync_skipped", reason: result.reason }));
      return jsonResponse(200, {
        ok: true,
        dryRun,
        skipped: true,
        reason: result.reason,
        log: logs.slice(-8000).join("\n"),
      });
    }

    const ok = result.errors.length === 0;
    /** @type {Record<string, unknown>} */
    const body = {
      ok,
      dryRun,
      urls: result.urls,
      updatedRows: result.updatedRows,
      wouldUpdateRows: result.wouldUpdateRows,
      unchanged: result.unchanged,
      errors: result.errors,
      log: logs.slice(-8000).join("\n"),
    };

    if (!ok) {
      const sample = result.errors
        .slice(0, 3)
        .map((e) => `${e.url}: ${e.message}`)
        .join("\n");
      await alertOnce({
        kind: "sync_errors",
        message: `${result.errors.length} URL(s) failed`,
        detail: sample,
      });
    }

    if (!dryRun && result.stateOk === false) {
      await alertOnce({
        kind: "state_not_saved",
        message: "mos-sync-state not persisted (S3)",
      });
    }

    if (!dryRun && result.snapshotOk === false) {
      await alertOnce({
        kind: "snapshot_not_saved",
        message: "ops/mos-enrolled-snapshot.json write failed (S3 timeout?)",
      });
    }

    if (
      !dryRun &&
      ok &&
      (result.updatedRows ?? 0) > 0 &&
      autoPublishEnabled()
    ) {
      onProgress("[mos-enrolled] dispatching hot sheet-sync (GitHub)…");
      const pub = await triggerSheetSyncHot();
      body.publish = pub;
      if (!pub.ok && !pub.skipped) {
        onProgress(`[mos-enrolled] publish failed: ${pub.reason}`);
      } else if (pub.ok) {
        onProgress("[mos-enrolled] hot sheet-sync dispatched — S3 updates in ~1–3 min");
      } else {
        onProgress(`[mos-enrolled] publish skipped: ${pub.reason}`);
      }
    }

    console.log(
      JSON.stringify({
        phase: "sync_done",
        ok,
        updatedRows: result.updatedRows,
        errors: result.errors.length,
        published: Boolean(body.publish?.ok),
        stateOk: result.stateOk ?? null,
        snapshotOk: result.snapshotOk ?? null,
        cookiesSaved: Boolean(result.cookieSave?.saved),
      }),
    );

    return jsonResponse(ok ? 200 : 500, body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(JSON.stringify({ phase: "sync_error", message, stack }));
    await alertOnce({
      kind: "sync_exception",
      message,
      detail: stack?.split("\n").slice(0, 5).join("\n"),
    });
    return jsonResponse(500, {
      ok: false,
      dryRun,
      error: message,
      log: logs.slice(-8000).join("\n"),
    });
  } finally {
    mosSyncTrace("H4", "index.js:finally", "handler finally", {
      dryRun,
      elapsedMs: Date.now() - handlerStartedAt,
      failureAlerted,
    });
    if (!dryRun) {
      try {
        await releaseSyncLock();
      } catch (err) {
        console.warn(
          "[mos-enrolled] releaseSyncLock:",
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }
}
