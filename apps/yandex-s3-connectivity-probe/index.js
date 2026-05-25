import { runS3ConnectivityProbe } from "./s3-connectivity-probe.mjs";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

/**
 * @param {import("aws-lambda").APIGatewayProxyEvent | Record<string, unknown>} event
 */
export async function handler(event = {}) {
  let body = {};
  try {
    const raw = event.body;
    body =
      typeof raw === "string" && raw
        ? JSON.parse(raw)
        : typeof event === "object" && event !== null
          ? event
          : {};
  } catch {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "invalid_json" }),
    };
  }

  const rounds = Number(body.rounds) || undefined;
  const sendTelegram = body.sendTelegram !== false;

  try {
    const result = await runS3ConnectivityProbe({
      rounds,
      sendTelegram,
      source: String(body.source ?? "ycf-manual").trim() || "ycf-manual",
    });
    return {
      statusCode: result.ok ? 200 : 503,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        ok: result.ok,
        summary: result.summary,
        logLines: result.lines?.length ?? 0,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[s3-probe] fatal:", message);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: message }),
    };
  }
}
