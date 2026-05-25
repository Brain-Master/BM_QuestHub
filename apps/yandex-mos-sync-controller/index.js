import { runMosSyncControllerTick } from "./mos-sync-controller.mjs";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

/**
 * @param {Record<string, unknown>} [event]
 */
function normalizeEvent(event) {
  if (typeof event === "string") {
    try {
      return JSON.parse(event);
    } catch {
      return {};
    }
  }
  return event ?? {};
}

function parseJsonBody(event) {
  if (event?.cronSecret) return event;
  if (!event?.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function readCronSecret(event) {
  const body = parseJsonBody(event);
  const qs = event?.queryStringParameters ?? event?.params ?? {};
  return (
    body?.cronSecret ??
    qs?.cronSecret ??
    qs?.key ??
    event?.cronSecret ??
    ""
  );
}

export async function handler(event = {}) {
  const normalized = normalizeEvent(event);
  const expected = process.env.MOS_CONTROLLER_CRON_SECRET?.trim();
  const provided = String(readCronSecret(normalized)).trim();
  const isHttpCall = Boolean(normalized.httpMethod || normalized.requestContext?.http);
  if (expected && isHttpCall && provided !== expected) {
    return jsonResponse(403, { ok: false, error: "forbidden" });
  }

  console.log(JSON.stringify({ phase: "controller_start", source: normalized.source ?? "timer" }));

  try {
    const result = await runMosSyncControllerTick();
    console.log(
      JSON.stringify({
        phase: "controller_done",
        ok: result.ok,
        invoked: result.invoked,
        reason: result.reason,
        stateOk: result.stateOk,
        invokeStatus: result.invokeStatus,
      }),
    );
    return jsonResponse(result.ok ? 200 : 500, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(JSON.stringify({ phase: "controller_error", message, stack }));
    return jsonResponse(500, { ok: false, error: message });
  }
}
