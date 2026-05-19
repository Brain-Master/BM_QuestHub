"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

const { handler, _internals } = require("./index");

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_CONSOLE_ERROR = console.error;
const ORIGINAL_CONSOLE_WARN = console.warn;

function serviceAccountJson() {
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  return JSON.stringify({
    client_email: "questhub-leads@example.iam.gserviceaccount.com",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
  });
}

function setBaseEnv() {
  process.env = {
    ...ORIGINAL_ENV,
    ALLOWED_ORIGINS: "https://quest.b-master.pro",
    TELEGRAM_BOT_TOKEN: "telegram-token",
    TELEGRAM_CHAT_ID: "telegram-chat",
    GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccountJson(),
    GOOGLE_SHEETS_SPREADSHEET_ID: "spreadsheet-id",
    GOOGLE_LEADS_SHEET_RANGE: "Leads!A:S",
    N8N_WEBHOOK_URL: "https://n8n.example/webhook/lead",
    N8N_TIMEOUT_MS: "1000",
  };
}

function leadPayload(overrides = {}) {
  return {
    leadType: "booking",
    registrationChannel: "brainmaster",
    parentName: "Иван Иванов",
    contact: "+7 999 000-00-00",
    childName: "Петя Иванов",
    childAge: "9",
    comment: "Без аллергий",
    consent: true,
    questSlug: "minecraft-taina-drevnih-inzhenerov",
    questTitle: "Minecraft: Тайна Древних Инженеров",
    offerId: "offer-1",
    variantId: "half-day",
    variantTitle: "Полдня · 09:00",
    venueSlug: "school-1517",
    venueName: "Школа №1517",
    schoolSlug: "school-1517",
    submittedAt: "2026-05-18T10:00:00.000Z",
    source: "bm-questhub-static",
    ...overrides,
  };
}

function event(payload, method = "POST") {
  return {
    httpMethod: method,
    headers: { origin: "https://quest.b-master.pro" },
    body: JSON.stringify(payload),
  };
}

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  global.fetch = ORIGINAL_FETCH;
  console.error = ORIGINAL_CONSOLE_ERROR;
  console.warn = ORIGINAL_CONSOLE_WARN;
});

test("valid lead is sent to Telegram, Google Sheets, and n8n", async () => {
  setBaseEnv();
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(event(leadPayload()), { requestId: "req-1" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.requestId, "req-1");
  assert.equal(body.n8nForwarded, true);
  assert.equal(calls.length, 4);
  assert.ok(calls[0].url.includes("api.telegram.org"));
  assert.ok(calls[1].url.includes("oauth2.googleapis.com"));
  assert.ok(calls[2].url.includes("sheets.googleapis.com"));
  assert.equal(calls[3].url, "https://n8n.example/webhook/lead");
});

test("invalid payload returns 400 before external calls", async () => {
  setBaseEnv();
  let callCount = 0;
  global.fetch = async () => {
    callCount += 1;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(event(leadPayload({ consent: false })), { requestId: "req-2" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 400);
  assert.equal(body.ok, false);
  assert.deepEqual(body.issues, ["consent must be true"]);
  assert.equal(callCount, 0);
});

test("primary delivery failure returns 502 and skips n8n", async () => {
  setBaseEnv();
  console.error = () => {};
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    if (String(url).includes("sheets.googleapis.com")) {
      return new Response("sheet append failed", { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(event(leadPayload()), { requestId: "req-3" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 502);
  assert.equal(body.ok, false);
  assert.equal(calls.some((call) => call.url === "https://n8n.example/webhook/lead"), false);
});

test("n8n failure does not fail accepted lead", async () => {
  setBaseEnv();
  console.warn = () => {};
  global.fetch = async (url) => {
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    if (String(url).includes("n8n.example")) {
      return new Response("automation down", { status: 503 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(event(leadPayload()), { requestId: "req-4" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.n8nAttempted, true);
  assert.equal(body.n8nForwarded, false);
});

test("sheet row contract keeps expected column order", () => {
  const lead = _internals.normalizeLead(leadPayload(), "req-5");
  assert.deepEqual(_internals.leadToSheetRow(lead), [
    lead.receivedAt,
    "2026-05-18T10:00:00.000Z",
    "req-5",
    "booking",
    "brainmaster",
    "Иван Иванов",
    "+7 999 000-00-00",
    "Петя Иванов",
    "9",
    "Minecraft: Тайна Древних Инженеров",
    "minecraft-taina-drevnih-inzhenerov",
    "Школа №1517",
    "school-1517",
    "offer-1",
    "half-day",
    "Полдня · 09:00",
    "school-1517",
    "Без аллергий",
    "bm-questhub-static",
  ]);
});
