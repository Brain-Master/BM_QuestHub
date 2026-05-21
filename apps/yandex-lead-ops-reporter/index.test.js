"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

const { handler, _internals } = require("./index");

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_CONSOLE_ERROR = console.error;

function serviceAccountJson() {
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  return JSON.stringify({
    client_email: "questhub-ops@example.iam.gserviceaccount.com",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
  });
}

function setBaseEnv() {
  process.env = {
    ...ORIGINAL_ENV,
    ALLOWED_ORIGINS: "https://quest.b-master.pro",
    OPS_REPORT_TOKEN: "ops-secret",
    TELEGRAM_BOT_TOKEN: "telegram-token",
    OPS_TELEGRAM_CHAT_ID: "ops-chat",
    GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccountJson(),
    GOOGLE_SHEETS_SPREADSHEET_ID: "spreadsheet-id",
    GOOGLE_OPS_SHEET_RANGE: "Ops!A:K",
    OPS_RATE_LIMIT_WINDOW_MS: "60000",
  };
}

function opsPayload(overrides = {}) {
  return {
    event: "lead.client_submit_failed",
    source: "bm-questhub-static",
    occurredAt: "2026-05-21T12:00:00.000Z",
    httpStatus: 502,
    errorCode: "delivery_failed",
    errorMessage: "Сервис заявок временно недоступен",
    lead: {
      leadType: "booking",
      parentName: "Иван Иванов",
      contact: "+7 999 000-00-00",
      questSlug: "minecraft-taina",
      questTitle: "Minecraft",
      offerId: "offer-1",
      venueSlug: "school-1517",
    },
    ...overrides,
  };
}

function event(payload, options = {}) {
  const headers = {
    origin: options.origin ?? "https://quest.b-master.pro",
    ...(options.token ? { "x-ops-token": options.token } : {}),
  };
  return {
    httpMethod: options.method ?? "POST",
    headers,
    body: JSON.stringify(payload),
    requestContext: options.ip
      ? { identity: { sourceIp: options.ip } }
      : undefined,
  };
}

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  global.fetch = ORIGINAL_FETCH;
  console.error = ORIGINAL_CONSOLE_ERROR;
});

test("valid client event returns 202 and sends Telegram + Sheet", async () => {
  setBaseEnv();
  const calls = [];
  global.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(event(opsPayload()), { requestId: "ops-1" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 202);
  assert.equal(body.ok, true);
  assert.equal(body.requestId, "ops-1");
  assert.ok(calls.some((url) => url.includes("api.telegram.org")));
  assert.ok(calls.some((url) => url.includes("sheets.googleapis.com")));
});

test("server event with X-Ops-Token is accepted without browser origin", async () => {
  setBaseEnv();
  let telegramCalled = false;
  global.fetch = async (url) => {
    if (String(url).includes("api.telegram.org")) telegramCalled = true;
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(
    event(
      opsPayload({
        event: "lead.server_error",
        source: "bm-lead-receiver",
        errorCode: "delivery_failed",
      }),
      { origin: "", token: "ops-secret" },
    ),
    { requestId: "ops-2" },
  );

  assert.equal(res.statusCode, 202);
  assert.equal(telegramCalled, true);
});

test("forbidden without token or allowed origin", async () => {
  setBaseEnv();
  global.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });

  const res = await handler(
    event(opsPayload(), { origin: "https://evil.example" }),
    { requestId: "ops-3" },
  );

  assert.equal(res.statusCode, 403);
});

test("invalid payload returns 400", async () => {
  setBaseEnv();
  global.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });

  const res = await handler(
    event(opsPayload({ errorCode: "unknown_code" }), { token: "ops-secret" }),
    { requestId: "ops-4" },
  );
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 400);
  assert.equal(body.ok, false);
});

test("client event dedupe returns 202 deduped", async () => {
  setBaseEnv();
  console.error = () => {};
  global.fetch = async (url) => {
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const payload = opsPayload();
  const first = await handler(event(payload, { ip: "1.2.3.4" }), { requestId: "ops-5a" });
  const second = await handler(event(payload, { ip: "1.2.3.4" }), { requestId: "ops-5b" });
  const secondBody = JSON.parse(second.body);

  assert.equal(first.statusCode, 202);
  assert.equal(second.statusCode, 202);
  assert.equal(secondBody.deduped, true);
});

test("telegram failure still returns 202", async () => {
  setBaseEnv();
  console.error = () => {};
  global.fetch = async (url) => {
    if (String(url).includes("api.telegram.org")) {
      return new Response("telegram down", { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(event(opsPayload(), { token: "ops-secret" }), { requestId: "ops-6" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 202);
  assert.equal(body.ok, true);
});

test("formatTelegramMessage escapes HTML", () => {
  const text = _internals.formatTelegramMessage(
    _internals.normalizeOpsEvent(
      opsPayload({
        errorMessage: "<script>alert(1)</script>",
        lead: { parentName: "A & B", questSlug: "q", offerId: "o", contact: "+7" },
      }),
      "req-x",
    ),
  );
  assert.ok(text.includes("&lt;script&gt;"));
  assert.ok(text.includes("A &amp; B"));
});
