"use strict";

const crypto = require("node:crypto");

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

const MAX_BODY_BYTES = 8192;
const DEFAULT_RATE_LIMIT_MS = 60_000;

const EVENT_TYPES = new Set([
  "lead.server_error",
  "lead.client_submit_failed",
  "site.health_check_failed",
]);
const SOURCES = new Set(["bm-lead-receiver", "bm-questhub-static", "bm-site-health"]);
const ERROR_CODES = new Set([
  "invalid_payload",
  "delivery_failed",
  "network",
  "not_configured",
  "site_unreachable",
  "site_slow",
  "site_bad_response",
]);

const EVENT_TITLES = {
  "lead.server_error": "Ошибка приёма заявки (сервер)",
  "lead.client_submit_failed": "Заявка не отправилась с сайта",
  "site.health_check_failed": "Проблема с доступностью сайта",
};

const SOURCE_LABELS = {
  "bm-lead-receiver": "Yandex Function · приём заявок",
  "bm-questhub-static": "Сайт Quest Hub · форма заявки",
  "bm-site-health": "Автопроверка · GitHub Actions",
};

const ERROR_LABELS = {
  invalid_payload: "Некорректные данные",
  delivery_failed: "Сервис заявок не ответил",
  network: "Сеть или таймаут",
  not_configured: "Приём заявок не настроен",
  site_unreachable: "Страница не открывается",
  site_slow: "Страница отвечает слишком долго",
  site_bad_response: "Страница открылась, но ответ подозрительный",
};

const LEAD_SNAPSHOT_FIELDS = [
  "leadType",
  "registrationChannel",
  "questSlug",
  "questTitle",
  "offerId",
  "venueSlug",
  "venueName",
  "parentName",
  "contact",
  "childName",
  "childAge",
];

const rateLimitStore = new Map();

function readEnv(name, options = {}) {
  const value = process.env[name]?.trim();
  if (!value && options.required) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value ?? "";
}

function readRateLimitWindowMs() {
  const value = Number(process.env.OPS_RATE_LIMIT_WINDOW_MS);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_RATE_LIMIT_MS;
  return Math.min(value, 300_000);
}

function response(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      ...JSON_HEADERS,
      ...corsHeaders(origin),
    },
    body: JSON.stringify(body),
  };
}

function corsHeaders(origin) {
  const allowedOrigins = readEnv("ALLOWED_ORIGINS")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allowHeaders = "content-type, x-ops-token";

  if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
    return {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": allowHeaders,
    };
  }

  if (origin && allowedOrigins.includes(origin)) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": allowHeaders,
      vary: "Origin",
    };
  }

  return {
    "access-control-allow-origin": allowedOrigins[0],
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": allowHeaders,
    vary: "Origin",
  };
}

function getHeader(headers, name) {
  if (!headers) return "";
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) return String(value);
  }
  return "";
}

function getMethod(event) {
  return (
    event.httpMethod ||
    event.requestContext?.http?.method ||
    event.requestContext?.httpMethod ||
    ""
  ).toUpperCase();
}

function getClientIp(event) {
  return (
    getHeader(event.headers, "x-forwarded-for").split(",")[0]?.trim() ||
    getHeader(event.headers, "x-real-ip") ||
    event.requestContext?.identity?.sourceIp ||
    "unknown"
  );
}

function parseJsonBody(event) {
  if (!event.body) throw new Error("Empty request body");
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    throw new Error("Request body too large");
  }
  return JSON.parse(raw);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function pickLeadSnapshot(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const lead = {};
  for (const field of LEAD_SNAPSHOT_FIELDS) {
    if (typeof raw[field] === "string" && raw[field].trim().length > 0) {
      lead[field] = raw[field].trim();
    }
  }
  return Object.keys(lead).length > 0 ? lead : undefined;
}

function validateOpsEvent(payload) {
  const issues = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, issues: ["Payload must be a JSON object"] };
  }

  if (!EVENT_TYPES.has(payload.event)) issues.push("event is invalid");
  if (!SOURCES.has(payload.source)) issues.push("source is invalid");
  if (typeof payload.occurredAt !== "string" || payload.occurredAt.trim().length === 0) {
    issues.push("occurredAt is required");
  }
  if (!ERROR_CODES.has(payload.errorCode)) issues.push("errorCode is invalid");
  if (typeof payload.errorMessage !== "string" || payload.errorMessage.trim().length === 0) {
    issues.push("errorMessage is required");
  }

  if (payload.requestId !== undefined && typeof payload.requestId !== "string") {
    issues.push("requestId must be a string");
  }
  if (
    payload.httpStatus !== undefined &&
    (typeof payload.httpStatus !== "number" || !Number.isFinite(payload.httpStatus))
  ) {
    issues.push("httpStatus must be a number");
  }
  if (payload.issues !== undefined) {
    if (!Array.isArray(payload.issues) || payload.issues.some((item) => typeof item !== "string")) {
      issues.push("issues must be an array of strings");
    }
  }
  if (payload.lead !== undefined) {
    const lead = pickLeadSnapshot(payload.lead);
    if (!lead) issues.push("lead must include at least one known field");
  }

  const allowedKeys = new Set([
    "event",
    "source",
    "occurredAt",
    "requestId",
    "httpStatus",
    "errorCode",
    "errorMessage",
    "issues",
    "lead",
  ]);
  for (const key of Object.keys(payload)) {
    if (!allowedKeys.has(key)) issues.push(`unknown field: ${key}`);
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true };
}

function normalizeOpsEvent(payload, requestId) {
  return {
    requestId: payload.requestId?.trim() || requestId,
    event: payload.event,
    source: payload.source,
    occurredAt: payload.occurredAt.trim(),
    httpStatus: typeof payload.httpStatus === "number" ? payload.httpStatus : 0,
    errorCode: payload.errorCode,
    errorMessage: payload.errorMessage.trim(),
    issues: Array.isArray(payload.issues)
      ? payload.issues.map((item) => String(item).trim()).filter(Boolean)
      : [],
    lead: pickLeadSnapshot(payload.lead),
    receivedAt: new Date().toISOString(),
  };
}

function isAuthorized(event, origin) {
  const token = readEnv("OPS_REPORT_TOKEN");
  const headerToken = getHeader(event.headers, "x-ops-token");
  if (token && headerToken && headerToken === token) return true;

  const allowedOrigins = readEnv("ALLOWED_ORIGINS")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) return true;
  return Boolean(origin && allowedOrigins.includes(origin));
}

function shouldRateLimit(event, clientIp) {
  if (event.event === "site.health_check_failed") {
    const target = event.issues[0] ?? event.errorMessage;
    const key = `health|${target}`;
    const windowMs = readRateLimitWindowMs();
    const now = Date.now();
    const last = rateLimitStore.get(key);
    if (last && now - last < windowMs) return true;
    rateLimitStore.set(key, now);
    return false;
  }

  if (event.event !== "lead.client_submit_failed") return false;
  const contact = event.lead?.contact ?? "";
  const offerId = event.lead?.offerId ?? "";
  const key = `${event.event}|${contact}|${offerId}|${clientIp}`;
  const windowMs = readRateLimitWindowMs();
  const now = Date.now();
  const last = rateLimitStore.get(key);
  if (last && now - last < windowMs) return true;
  rateLimitStore.set(key, now);
  if (rateLimitStore.size > 500) {
    for (const [storedKey, ts] of rateLimitStore) {
      if (now - ts > windowMs) rateLimitStore.delete(storedKey);
    }
  }
  return false;
}

function formatOccurredAt(iso) {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

function formatTelegramMessage(event) {
  const title = EVENT_TITLES[event.event] ?? event.event;
  const sourceLabel = SOURCE_LABELS[event.source] ?? event.source;
  const errorLabel = ERROR_LABELS[event.errorCode] ?? event.errorCode;

  const lines = [`⚠️ <b>${escapeHtml(title)}</b>`, "", escapeHtml(event.errorMessage)];

  if (errorLabel !== event.errorMessage) {
    lines.push("", `<i>${escapeHtml(errorLabel)}</i>`);
  }

  if (event.lead?.parentName) lines.push("", `👤 ${escapeHtml(event.lead.parentName)}`);
  if (event.lead?.contact) lines.push(`📞 ${escapeHtml(event.lead.contact)}`);
  if (event.lead?.questTitle) lines.push(`🎯 ${escapeHtml(event.lead.questTitle)}`);

  if (event.issues.length > 0) {
    lines.push("", "📋", ...event.issues.map((item) => `• ${escapeHtml(item)}`));
  }

  const meta = [
    `🕒 ${escapeHtml(formatOccurredAt(event.occurredAt))} (МСК)`,
    `📡 ${escapeHtml(sourceLabel)}`,
  ];
  if (event.httpStatus > 0) meta.push(`HTTP ${event.httpStatus}`);
  if (event.requestId) meta.push(`ID ${escapeHtml(event.requestId)}`);

  lines.push("", meta.join("\n"));

  const spoilerLines = [];
  if (event.lead?.questSlug) spoilerLines.push(`квест: ${event.lead.questSlug}`);
  if (event.lead?.venueSlug) spoilerLines.push(`площадка: ${event.lead.venueSlug}`);
  if (event.lead?.offerId) spoilerLines.push(`смена: ${event.lead.offerId}`);
  if (spoilerLines.length > 0) {
    lines.push(
      "",
      `<tg-spoiler>${spoilerLines.map((line) => escapeHtml(line)).join("\n")}</tg-spoiler>`,
    );
  }

  return lines.join("\n");
}

async function sendTelegramOpsAlert(event) {
  const token = readEnv("TELEGRAM_BOT_TOKEN", { required: true });
  const chatId = readEnv("OPS_TELEGRAM_CHAT_ID", { required: true });
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      chat_id: chatId,
      text: formatTelegramMessage(event),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram API ${res.status}: ${text.slice(0, 500)}`);
  }
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function loadGoogleServiceAccount() {
  const encoded = readEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
  const raw = encoded
    ? Buffer.from(encoded, "base64url").toString("utf8")
    : readEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("Google service account JSON is not configured");
  const account = JSON.parse(raw);
  if (!account.client_email || !account.private_key) {
    throw new Error("Google service account JSON must include client_email and private_key");
  }
  return account;
}

async function getGoogleAccessToken() {
  const account = loadGoogleServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(account.private_key, "base64url");
  const assertion = `${unsignedToken}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Google OAuth ${res.status}: ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json.access_token;
}

function eventToSheetRow(event) {
  const lead = event.lead ?? {};
  return [
    event.receivedAt,
    event.occurredAt,
    event.requestId,
    event.event,
    event.source,
    event.httpStatus,
    event.errorCode,
    event.errorMessage,
    event.issues.join("; "),
    lead.parentName ?? "",
    lead.contact ?? "",
    lead.questTitle ?? "",
    lead.offerId ?? "",
  ];
}

async function appendOpsEventToGoogleSheet(event) {
  const range = readEnv("GOOGLE_OPS_SHEET_RANGE");
  if (!range) return { attempted: false, ok: false };

  const spreadsheetId = readEnv("GOOGLE_SHEETS_SPREADSHEET_ID", { required: true });
  const token = await getGoogleAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append`,
  );
  url.searchParams.set("valueInputOption", "USER_ENTERED");
  url.searchParams.set("insertDataOption", "INSERT_ROWS");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ values: [eventToSheetRow(event)] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets API ${res.status}: ${text.slice(0, 500)}`);
  }
  return { attempted: true, ok: true };
}

function logStructuredEvent(event, extra = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      service: "bm-lead-ops-reporter",
      ...event,
      ...extra,
    }),
  );
}

async function deliverOpsAlert(event) {
  let telegramOk = false;
  try {
    await sendTelegramOpsAlert(event);
    telegramOk = true;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        service: "bm-lead-ops-reporter",
        message: "Telegram ops alert failed",
        error: String(error),
        requestId: event.requestId,
      }),
    );
  }

  try {
    const sheet = await appendOpsEventToGoogleSheet(event);
    if (sheet.attempted && !sheet.ok) {
      console.error(
        JSON.stringify({
          level: "error",
          service: "bm-lead-ops-reporter",
          message: "Google Sheet ops log failed",
          requestId: event.requestId,
        }),
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        service: "bm-lead-ops-reporter",
        message: "Google Sheet ops log failed",
        error: String(error),
        requestId: event.requestId,
      }),
    );
  }

  if (!telegramOk) {
    throw new Error("Telegram ops alert failed");
  }
}

async function handler(event = {}, context = {}) {
  const origin = getHeader(event.headers, "origin");
  const method = getMethod(event);

  if (method === "OPTIONS") {
    return response(204, {}, origin);
  }

  if (method !== "POST") {
    return response(405, { ok: false, error: "Method not allowed" }, origin);
  }

  if (!isAuthorized(event, origin)) {
    return response(403, { ok: false, error: "Forbidden" }, origin);
  }

  let payload;
  try {
    payload = parseJsonBody(event);
  } catch (error) {
    logStructuredEvent({ errorCode: "bad_request", errorMessage: String(error) });
    return response(400, { ok: false, error: "Invalid JSON body" }, origin);
  }

  const validation = validateOpsEvent(payload);
  if (!validation.ok) {
    logStructuredEvent({
      errorCode: "invalid_payload",
      errorMessage: "Invalid ops event",
      issues: validation.issues,
    });
    return response(
      400,
      { ok: false, error: "Invalid ops event", issues: validation.issues },
      origin,
    );
  }

  const requestId = context.requestId || context.awsRequestId || crypto.randomUUID();
  const opsEvent = normalizeOpsEvent(payload, requestId);
  const clientIp = getClientIp(event);

  if (shouldRateLimit(opsEvent, clientIp)) {
    logStructuredEvent(opsEvent, { deduped: true, clientIp });
    return response(202, { ok: true, deduped: true }, origin);
  }

  logStructuredEvent(opsEvent, { clientIp });

  try {
    await deliverOpsAlert(opsEvent);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        service: "bm-lead-ops-reporter",
        message: "Ops alert delivery failed",
        error: String(error),
        requestId: opsEvent.requestId,
      }),
    );
  }

  return response(202, { ok: true, requestId: opsEvent.requestId }, origin);
}

exports.handler = handler;
exports._internals = {
  EVENT_TYPES,
  ERROR_CODES,
  appendOpsEventToGoogleSheet,
  deliverOpsAlert,
  formatTelegramMessage,
  isAuthorized,
  normalizeOpsEvent,
  parseJsonBody,
  pickLeadSnapshot,
  shouldRateLimit,
  validateOpsEvent,
};
