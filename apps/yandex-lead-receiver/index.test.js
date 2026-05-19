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

function stripSpoiler(text) {
  return text.replace(/<tg-spoiler>[\s\S]*<\/tg-spoiler>/, "");
}

test("formatTelegramMessage renders mos_assist lead for humans", () => {
  const lead = _internals.normalizeLead(
    leadPayload({
      leadType: "mos_assist",
      registrationChannel: "mos_ru",
      parentName: "Тестировой Тестян",
      contact: "89999999999",
      childName: "кулебяка",
      childAge: "111",
      questSlug: "mekhvarium-laboratoriya-kineticheskih-monstrov",
      questTitle: "Мехвариум: лаборатория кинетических монстров",
      offerId:
        "sheet:mekhvarium-laboratoriya-kineticheskih-monstrov:school-1212-yasenevo:2026-06-01:2026-06-05:8:30",
      variantTitle: "Полный день · Пн-Пт, 8:30 – 16:30",
      venueSlug: "school-1212-yasenevo",
      venueName: "ГБОУ Школа №1212",
      comment: "Бубубу",
    }),
    "d8573ec0-ab0d-4a69-bd8b-1c8dfef84af7",
  );
  lead.receivedAt = "2026-05-19T00:05:44.044Z";

  const text = _internals.formatTelegramMessage(lead);
  const visible = stripSpoiler(text);

  assert.match(visible, /Запись через mos\.ru/);
  assert.match(visible, /Тестировой Тестян/);
  assert.match(visible, /кулебяка · 111/);
  assert.match(visible, /Мехвариум: лаборатория кинетических монстров/);
  assert.match(visible, /ГБОУ Школа №1212/);
  assert.match(visible, /1–5 июня 2026/);
  assert.match(visible, /Полный день · Пн-Пт, 8:30 – 16:30/);
  assert.match(visible, /Бубубу/);
  assert.match(visible, /МСК/);
  assert.doesNotMatch(visible, /mekhvarium-laboratoriya/);
  assert.doesNotMatch(visible, /sheet:/);
  assert.match(text, /<tg-spoiler>/);
  assert.match(text, /d8573ec0-ab0d-4a69-bd8b-1c8dfef84af7/);
  assert.match(text, /offer: sheet:mekhvarium/);
});

test("formatTelegramMessage renders booking lead title", () => {
  const lead = _internals.normalizeLead(leadPayload(), "req-booking");
  const text = stripSpoiler(_internals.formatTelegramMessage(lead));

  assert.match(text, /Новая заявка на бронирование/);
  assert.doesNotMatch(text, /портал mos\.ru/);
});

test("formatTelegramMessage escapes HTML in user fields", () => {
  const lead = _internals.normalizeLead(
    leadPayload({ comment: "<script>alert(1)</script>" }),
    "req-xss",
  );
  const text = _internals.formatTelegramMessage(lead);

  assert.match(text, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(text, /<script>alert/);
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
