import { recordScheduleVisit } from "./schedule-traffic.mjs";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

/** @type {Map<string, { count: number, resetAt: number }>} */
const ipBuckets = new Map();
const IP_LIMIT_PER_MIN = Number(process.env.SCHEDULE_PULSE_IP_LIMIT_PER_MIN || 30);

function corsHeaders(origin) {
  const allowed = (process.env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes("*") || allowed.length === 0) {
    return {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    };
  }
  if (origin && allowed.includes(origin)) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
    };
  }
  return {};
}

function json(statusCode, body, origin) {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...corsHeaders(origin) },
    body: JSON.stringify(body),
  };
}

/**
 * @param {string | undefined} ip
 */
function rateLimitOk(ip) {
  const key = ip || "unknown";
  const now = Date.now();
  const bucket = ipBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    ipBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= IP_LIMIT_PER_MIN;
}

/**
 * @param {import("aws-lambda").APIGatewayProxyEvent | Record<string, unknown>} event
 */
export async function handler(event = {}) {
  const origin =
    typeof event.headers?.origin === "string"
      ? event.headers.origin
      : typeof event.headers?.Origin === "string"
        ? event.headers.Origin
        : undefined;

  const method = event.httpMethod || event.requestContext?.http?.method || "POST";
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(origin), body: "" };
  }

  const ip =
    event.requestContext?.identity?.sourceIp ||
    event.headers?.["x-forwarded-for"]?.split(",")[0]?.trim();

  if (!rateLimitOk(ip)) {
    return json(429, { ok: false, error: "rate_limited" }, origin);
  }

  let body = {};
  try {
    const raw = event.body;
    body = typeof raw === "string" && raw ? JSON.parse(raw) : event;
  } catch {
    return json(400, { ok: false, error: "invalid_json" }, origin);
  }

  const page = String(body.page ?? "schedule").trim() || "schedule";
  const ts = Number(body.ts) || Date.now();

  try {
    const timeoutMs = Number(process.env.SCHEDULE_PULSE_S3_TIMEOUT_MS || 12_000);
    await Promise.race([
      recordScheduleVisit({ page, ts }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("s3_timeout")), timeoutMs);
      }),
    ]);
    return json(200, { ok: true }, origin);
  } catch (err) {
    if (String(err?.message || err).includes("s3_timeout")) {
      console.warn("[traffic] S3 slow — accepted without persist");
      return json(202, { ok: true, deferred: true }, origin);
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return json(500, { ok: false, error: message }, origin);
  }
}
