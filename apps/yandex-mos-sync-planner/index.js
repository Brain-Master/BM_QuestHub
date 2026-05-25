import path from "node:path";
import { fileURLToPath } from "node:url";

import { runMosEnrolledPlan } from "./mos-enrolled-plan.mjs";

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

  const logs = [];
  const onProgress = (msg) => {
    console.log(msg);
    logs.push(msg);
  };

  console.log(
    JSON.stringify({
      phase: "planner_start",
      dryRun,
      source: normalized.source ?? "invoke",
    }),
  );

  try {
    const result = await runMosEnrolledPlan({
      root: __dirname,
      dryRun,
      force: dryRun || process.env.MOS_ENROLLED_FORCE === "1",
      onProgress,
    });
    return jsonResponse(200, {
      ...result,
      log: logs.slice(-4000).join("\n"),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ phase: "planner_error", message }));
    return jsonResponse(500, { ok: false, error: message, log: logs.join("\n") });
  }
}
