"use strict";

const crypto = require("node:crypto");

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

const REQUIRED_STRING_FIELDS = [
  "parentName",
  "contact",
  "childName",
  "childAge",
  "questSlug",
  "questTitle",
  "offerId",
  "venueSlug",
  "venueName",
];

const LEAD_TYPES = new Set(["booking", "waitlist", "mos_assist"]);
const REGISTRATION_CHANNELS = new Set(["mos_ru", "brainmaster"]);
const DEFAULT_N8N_TIMEOUT_MS = 2500;
const OPS_REPORT_TIMEOUT_MS = 2000;

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

function readEnv(name, options = {}) {
  const value = process.env[name]?.trim();
  if (!value && options.required) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value ?? "";
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

  if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
    return {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    };
  }

  if (origin && allowedOrigins.includes(origin)) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
    };
  }

  return {
    "access-control-allow-origin": allowedOrigins[0],
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
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

function parseJsonBody(event) {
  if (!event.body) throw new Error("Empty request body");
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  return JSON.parse(raw);
}

function validateLeadPayload(payload) {
  const issues = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, issues: ["Payload must be a JSON object"] };
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof payload[field] !== "string" || payload[field].trim().length === 0) {
      issues.push(`${field} is required`);
    }
  }

  if (payload.leadType !== undefined && !LEAD_TYPES.has(payload.leadType)) {
    issues.push("leadType is invalid");
  }

  if (
    payload.registrationChannel !== undefined &&
    !REGISTRATION_CHANNELS.has(payload.registrationChannel)
  ) {
    issues.push("registrationChannel is invalid");
  }

  if (payload.consent !== true) {
    issues.push("consent must be true");
  }

  if (payload.comment !== undefined && typeof payload.comment !== "string") {
    issues.push("comment must be a string");
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true };
}

function normalizeLead(payload, requestId) {
  const receivedAt = new Date().toISOString();
  return {
    requestId,
    receivedAt,
    leadType: payload.leadType || "booking",
    registrationChannel: payload.registrationChannel,
    parentName: payload.parentName.trim(),
    contact: payload.contact.trim(),
    childName: payload.childName.trim(),
    childAge: payload.childAge.trim(),
    comment: typeof payload.comment === "string" ? payload.comment.trim() : "",
    consent: payload.consent === true,
    questSlug: payload.questSlug.trim(),
    questTitle: payload.questTitle.trim(),
    offerId: payload.offerId.trim(),
    variantId: typeof payload.variantId === "string" ? payload.variantId.trim() : "",
    variantTitle: typeof payload.variantTitle === "string" ? payload.variantTitle.trim() : "",
    venueSlug: payload.venueSlug.trim(),
    venueName: payload.venueName.trim(),
    schoolSlug: typeof payload.schoolSlug === "string" ? payload.schoolSlug.trim() : "",
    submittedAt: typeof payload.submittedAt === "string" ? payload.submittedAt.trim() : "",
    source: typeof payload.source === "string" ? payload.source.trim() : "bm-questhub-static",
  };
}

const RU_MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function leadTypeTitle(leadType) {
  const titles = {
    mos_assist: "Запись через mos.ru",
    waitlist: "Заявка в лист ожидания",
    booking: "Новая заявка на бронирование",
  };
  return titles[leadType] ?? "Новая заявка Quest Hub";
}

function registrationChannelLabel(channel) {
  if (channel === "mos_ru") return "портал mos.ru (договор школы)";
  if (channel === "brainmaster") return "BrainMaster напрямую";
  return "";
}

function parseIsoDate(iso) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month) - 1,
    day: Number(day),
  };
}

function formatRuDateRange(start, end) {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) {
    return start === end ? start : `${start} – ${end}`;
  }

  const { day: startDay, month: startMonth, year: startYear } = startDate;
  const { day: endDay, month: endMonth, year: endYear } = endDate;

  if (start === end) return `${startDay} ${RU_MONTHS[startMonth]} ${startYear}`;
  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay}–${endDay} ${RU_MONTHS[startMonth]} ${startYear}`;
  }
  return `${startDay} ${RU_MONTHS[startMonth]} – ${endDay} ${RU_MONTHS[endMonth]} ${endYear}`;
}

function parseSheetOfferId(offerId) {
  const match = offerId.match(
    /^sheet:([^:]+):([^:]+):(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2}):(.+)$/,
  );
  if (!match) return null;
  const [, questSlug, venueSlug, start, end, startTime] = match;
  return { questSlug, venueSlug, start, end, startTime };
}

function formatReceivedAtMsk(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const formatted = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted} МСК`;
}

function formatContactHtml(contact) {
  const trimmed = contact.trim();
  const digits = trimmed.replace(/\D/g, "");
  const looksLikePhone = /^[\d\s+\-()]+$/.test(trimmed) && digits.length >= 10;
  if (!looksLikePhone) return escapeHtml(trimmed);

  let tel = digits;
  if (tel.length === 11 && tel.startsWith("8")) tel = `7${tel.slice(1)}`;
  if (tel.length === 10) tel = `7${tel}`;
  return `<a href="tel:+${tel}">${escapeHtml(trimmed)}</a>`;
}

function buildTelegramSpoiler(lead) {
  const lines = [];
  if (lead.requestId) lines.push(`ID: ${lead.requestId}`);
  if (lead.questSlug) lines.push(`quest: ${lead.questSlug}`);
  if (lead.venueSlug) lines.push(`venue: ${lead.venueSlug}`);
  if (lead.offerId) lines.push(`offer: ${lead.offerId}`);
  if (lead.variantId) lines.push(`variant: ${lead.variantId}`);
  if (lead.schoolSlug) lines.push(`school: ${lead.schoolSlug}`);
  if (lines.length === 0) return "";
  return `<tg-spoiler>${lines.map((line) => escapeHtml(line)).join("\n")}</tg-spoiler>`;
}

function formatTelegramMessage(lead) {
  const blocks = [`📝 <b>${escapeHtml(leadTypeTitle(lead.leadType))}</b>`];

  if (lead.leadType === "waitlist" && lead.registrationChannel) {
    const channelLabel = registrationChannelLabel(lead.registrationChannel);
    if (channelLabel) blocks.push(`📋 ${escapeHtml(channelLabel)}`);
  }

  blocks.push(
    "",
    `👤 ${escapeHtml(lead.parentName)}`,
    `📞 ${formatContactHtml(lead.contact)}`,
    "",
    `👧 ${escapeHtml(lead.childName)} · ${escapeHtml(lead.childAge)}`,
    "",
    `🎯 ${escapeHtml(lead.questTitle)}`,
    `📍 ${escapeHtml(lead.venueName)}`,
  );

  const sheetOffer = parseSheetOfferId(lead.offerId);
  if (sheetOffer) {
    const dateLine = formatRuDateRange(sheetOffer.start, sheetOffer.end);
    if (dateLine) blocks.push(`📅 ${escapeHtml(dateLine)}`);
  }

  if (lead.variantTitle) {
    blocks.push(`🕐 ${escapeHtml(lead.variantTitle)}`);
  }

  if (lead.comment) {
    blocks.push("", `💬 ${escapeHtml(lead.comment)}`);
  }

  blocks.push("", `🕒 ${escapeHtml(formatReceivedAtMsk(lead.receivedAt))}`);

  const spoiler = buildTelegramSpoiler(lead);
  if (spoiler) {
    blocks.push("", spoiler);
  }

  return blocks.join("\n");
}

async function sendTelegramLead(lead) {
  const token = readEnv("TELEGRAM_BOT_TOKEN", { required: true });
  const chatId = readEnv("TELEGRAM_CHAT_ID", { required: true });
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      chat_id: chatId,
      text: formatTelegramMessage(lead),
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
    : readEnv("GOOGLE_SERVICE_ACCOUNT_JSON", { required: true });
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

function leadToSheetRow(lead) {
  return [
    lead.receivedAt,
    lead.submittedAt,
    lead.requestId,
    lead.leadType,
    lead.registrationChannel || "",
    lead.parentName,
    lead.contact,
    lead.childName,
    lead.childAge,
    lead.questTitle,
    lead.questSlug,
    lead.venueName,
    lead.venueSlug,
    lead.offerId,
    lead.variantId,
    lead.variantTitle,
    lead.schoolSlug,
    lead.comment,
    lead.source,
  ];
}

async function appendLeadToGoogleSheet(lead) {
  const spreadsheetId = readEnv("GOOGLE_SHEETS_SPREADSHEET_ID", { required: true });
  const range = readEnv("GOOGLE_LEADS_SHEET_RANGE", { required: true });
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
    body: JSON.stringify({ values: [leadToSheetRow(lead)] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets API ${res.status}: ${text.slice(0, 500)}`);
  }
}

function readTimeoutMs() {
  const value = Number(process.env.N8N_TIMEOUT_MS);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_N8N_TIMEOUT_MS;
  return Math.min(value, 10000);
}

async function forwardLeadToN8n(lead) {
  const url = readEnv("N8N_WEBHOOK_URL");
  if (!url) return { attempted: false, ok: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), readTimeoutMs());
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ event: "lead.received", lead }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`n8n webhook ${res.status}: ${text.slice(0, 500)}`);
      return { attempted: true, ok: false, status: res.status };
    }
    return { attempted: true, ok: true, status: res.status };
  } catch (error) {
    console.warn("n8n webhook failed", error);
    return { attempted: true, ok: false };
  } finally {
    clearTimeout(timeout);
  }
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

async function reportOpsEvent(details) {
  const url = readEnv("OPS_REPORT_URL");
  const token = readEnv("OPS_REPORT_TOKEN");
  if (!url || !token) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPS_REPORT_TIMEOUT_MS);
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-token": token,
      },
      body: JSON.stringify({
        source: "bm-lead-receiver",
        occurredAt: new Date().toISOString(),
        ...details,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    console.warn("ops report failed", error);
  } finally {
    clearTimeout(timeout);
  }
}

async function deliverPrimaryLead(lead) {
  await sendTelegramLead(lead);
  await appendLeadToGoogleSheet(lead);
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

  let payload;
  try {
    payload = parseJsonBody(event);
  } catch {
    return response(400, { ok: false, error: "Invalid JSON body" }, origin);
  }

  const requestId = context.requestId || context.awsRequestId || crypto.randomUUID();

  const validation = validateLeadPayload(payload);
  if (!validation.ok) {
    void reportOpsEvent({
      event: "lead.server_error",
      requestId,
      httpStatus: 400,
      errorCode: "invalid_payload",
      errorMessage: "Invalid lead payload",
      issues: validation.issues,
      lead: pickLeadSnapshot(payload),
    });
    return response(400, { ok: false, error: "Invalid lead payload", issues: validation.issues }, origin);
  }

  const lead = normalizeLead(payload, requestId);

  try {
    await deliverPrimaryLead(lead);
  } catch (error) {
    console.error("Primary lead delivery failed", error);
    void reportOpsEvent({
      event: "lead.server_error",
      requestId,
      httpStatus: 502,
      errorCode: "delivery_failed",
      errorMessage: "Primary lead delivery failed",
      lead: pickLeadSnapshot(lead),
    });
    return response(502, { ok: false, error: "Primary lead delivery failed" }, origin);
  }

  const n8n = await forwardLeadToN8n(lead);

  return response(200, {
    ok: true,
    requestId: lead.requestId,
    n8nForwarded: n8n.ok,
    n8nAttempted: n8n.attempted,
  }, origin);
}

exports.handler = handler;
exports._internals = {
  appendLeadToGoogleSheet,
  buildTelegramSpoiler,
  deliverPrimaryLead,
  escapeHtml,
  formatRuDateRange,
  formatTelegramMessage,
  forwardLeadToN8n,
  getMethod,
  leadToSheetRow,
  normalizeLead,
  pickLeadSnapshot,
  parseJsonBody,
  reportOpsEvent,
  parseSheetOfferId,
  validateLeadPayload,
};
