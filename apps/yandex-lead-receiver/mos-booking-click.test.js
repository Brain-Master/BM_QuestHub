"use strict";
const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { createMosClickHandler, validPayload, canonicalTarget, formatClickMessage, OFFERS_URL, VENUES_URL } = require("./mos-booking-click");
const { handler, _internals } = require("./index");
const origin = "https://b-master.pro";
const payload = (extra = {}) => ({ event: "booking.mos_click", eventId: randomUUID(), questSlug: "shmi", offerId: "year:К1", venueSlug: "school-2103", variantId: "main", ...extra });
const fixtures = () => ({
  offers: { version: 1, offersByQuest: { shmi: [{ id: "year:К1", venueSlug: "school-2103", mosBookingUrl: "https://www.mos.ru/pgu2/activity/card/111",
    scheduleCard: { displayTitle: "ШМИ <1>", variants: [{ id: "main", type: "Кружок", time: "Пн 16:00", mosBookingUrl: "https://www.mos.ru/pgu2/activity/card/222" }] },
    annual: { groupCode: "К1", admission: "open" }, sheetStatus: "Идёт набор" }] } },
  venues: { venues: [{ slug: "school-2103", name: "Школа №2103", address: "Голубинская, 13" }] },
});
function harness({ now = Date.now, fail, hold, data = fixtures(), env = {} } = {}) {
  const calls = [];
  const config = { ALLOWED_ORIGINS: origin, TELEGRAM_BOT_TOKEN: "test-only", TELEGRAM_CHAT_ID: "test-chat", ...env };
  mock.method(console, "info", () => {});
  mock.method(global, "fetch", async (url, options) => {
    calls.push({ url, options });
    assert.ok([OFFERS_URL, VENUES_URL, "https://api.telegram.org/bottest-only/sendMessage"].includes(url), "Unexpected outbound request");
    if (fail) { const result = await fail(url, options); if (result) return result; }
    if (hold) await hold(url);
    return Response.json(url === OFFERS_URL ? data.offers : url === VENUES_URL ? data.venues : { ok: true, result: { message_id: 1 } });
  });
  const send = createMosClickHandler({ boundedRequest: _internals.boundedRequest, deliveryBudget: _internals.deliveryBudget,
    readEnv: (key, opts) => { if (opts?.required && !config[key]) throw Error("Missing env"); return config[key] || ""; },
    response: (statusCode, body) => ({ statusCode, body }), now });
  return { calls, send };
}
afterEach(() => { mock.restoreAll(); mock.timers.reset(); });

test("exact event schema refuses personal fields, URLs, malformed IDs and unknown events", () => {
  assert.equal(validPayload(payload()), true);
  for (const extra of [{ contact: "+7999" }, { parentName: "private" }, { url: "https://evil.test" }, { event: "lead.fake" },
    { eventId: "bad" }, { venueSlug: "../elsewhere" }, { questSlug: "__proto__" }, { offerId: "a".repeat(321) }, { variantId: null }])
    assert.equal(validPayload(payload(extra)), false);
  for (const value of [null, [], {}, "event"]) assert.equal(validPayload(value), false);
});

test("canonical relations, variant override, fallback variant, exact destination and escaped message", () => {
  const { offers, venues } = fixtures();
  const target = canonicalTarget(payload(), offers, venues);
  assert.equal(target.url, "https://www.mos.ru/pgu2/activity/card/222");
  const message = formatClickMessage(target);
  assert.match(message, /не заявка и не подтверждение/); assert.match(message, /ШМИ &lt;1&gt;/);
  assert.match(message, /Голубинская/); assert.match(message, /Контактные данные.*не передаются/);
  for (const extra of [{ questSlug: "different" }, { venueSlug: "wrong" }, { offerId: "wrong" }, { variantId: "wrong" }])
    assert.equal(canonicalTarget(payload(extra), offers, venues), null);
  const offer = offers.offersByQuest.shmi[0]; offer.scheduleCard.variants = [];
  assert.ok(canonicalTarget(payload({ variantId: offer.id }), offers, venues));
  for (const url of ["http://www.mos.ru/pgu2/activity/card/1", "https://www.mos.ru.evil.test/pgu2/activity/card/1", "https://www.mos.ru/pgu2/activity/card/1?secret=x", "javascript:alert(1)"]){
    offer.mosBookingUrl = url; assert.equal(canonicalTarget(payload({ variantId: offer.id }), offers, venues), null);
  }
});

test("click sends only two fixed snapshot GETs and one Telegram POST; acknowledgement and cache/dedup", async () => {
  const { send, calls } = harness(); const p = payload();
  assert.deepEqual(await send(p, origin, "test"), { statusCode: 200, body: { ok: true, notified: true } });
  assert.equal(calls.length, 3);
  assert.ok(calls.every(c => c.options.redirect === "error"));
  assert.match(JSON.parse(calls[2].options.body).text, /card\/222/);
  assert.equal((await send(p, origin, "duplicate")).body.duplicate, true); assert.equal(calls.length, 3);
  assert.equal((await send(payload(), origin, "cooldown")).statusCode, 429);
  assert.equal((await send({ ...p, venueSlug: "different" }, origin, "conflict")).statusCode, 409);
});

test("fail-closed exact Origin and invalid payload start no upstream work", async () => {
  const { send, calls } = harness();
  for (const value of ["", "null", "*", "https://evil.test", "https://b-master.pro.evil.test"])
    assert.equal((await send(payload(), value)).statusCode, 403);
  assert.equal((await send(payload({ contact: "private" }), origin)).statusCode, 400);
  assert.equal(calls.length, 0);
});

test("unknown and cross-venue/variant identities never send Telegram", async () => {
  const { send, calls } = harness();
  for (const extra of [{ offerId: "wrong" }, { venueSlug: "wrong" }, { variantId: "wrong" }])
    assert.equal((await send(payload(extra), origin)).statusCode, 400);
  assert.equal(calls.length, 2, "Public source cache reused; no Telegram");
});

test("concurrent duplicates are pending, not falsely acknowledged", async () => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  const { send, calls } = harness({ hold: url => url.includes("telegram") ? gate : undefined });
  const p = payload(), first = send(p, origin);
  for (let i = 0; i < 10 && calls.length < 3; i++) await new Promise(resolve => setImmediate(resolve));
  const duplicate = await send(p, origin);
  assert.equal(duplicate.statusCode, 202); assert.equal(duplicate.body.notified, false);
  release(); assert.equal((await first).body.notified, true); assert.equal(calls.length, 3);
});

test("unacknowledged Telegram never claims notified and uncertain POST is never retried", async () => {
  const { send, calls } = harness({ fail: url => url.includes("telegram") ? Response.json({ ok: true }) : undefined });
  const p = payload(); assert.equal((await send(p, origin)).statusCode, 502);
  const duplicate = await send(p, origin); assert.equal(duplicate.body.notified, false); assert.equal(duplicate.statusCode, 202);
  assert.equal(calls.length, 3);
});

test("concurrent omitted and explicit-main variants of the same card share canonical cooldown", async () => {
  const data = fixtures(); delete data.offers.offersByQuest.shmi[0].scheduleCard.variants[0].mosBookingUrl;
  const { send, calls } = harness({ data });
  const omitted = payload(); delete omitted.variantId;
  const results = await Promise.all([send(omitted, origin), send(payload(), origin)]);
  assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 429]);
  assert.equal(calls.filter(c => c.url.includes("telegram")).length, 1);
});

test("public handler positively dispatches a canonical click without any lead sinks", async () => {
  const config = { ALLOWED_ORIGINS: origin, TELEGRAM_BOT_TOKEN: "test-only", TELEGRAM_CHAT_ID: "test-chat" };
  const previous = Object.fromEntries(Object.keys(config).map(key => [key, process.env[key]]));
  Object.assign(process.env, config);
  const data = fixtures(); data.offers.padding = "x".repeat(250_000);
  const { calls } = harness({ data });
  try {
    const result = await handler({ httpMethod: "POST", headers: { origin, "content-type": "application/json; charset=utf-8" }, body: JSON.stringify(payload()) });
    assert.equal(result.statusCode, 200); assert.equal(JSON.parse(result.body).notified, true);
    assert.equal(calls.length, 3, "250KiB snapshot allowed; only fixed source GETs + Telegram");
  } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});

test("stalled sources time out, abort, never send Telegram", async () => {
  mock.timers.enable({ apis: ["setTimeout", "Date"], now: 100000 });
  let signal;
  const { send, calls } = harness({ fail: (url, options) => { if (url === OFFERS_URL) { signal = options.signal; return new Promise(() => {}); } } });
  const result = send(payload(), origin);
  await new Promise(resolve => setImmediate(resolve)); mock.timers.tick(3001);
  assert.equal((await result).statusCode, 502); assert.equal(signal.aborted, true); assert.equal(calls.length, 2);
});

test("snapshot limit is separate from Telegram; oversized source cannot notify", async () => {
  const { send, calls } = harness({ fail: url => url === OFFERS_URL ? new Response("{}", { headers: { "content-length": String(2 * 1024 * 1024 + 1) } }) : undefined });
  assert.equal((await send(payload(), origin)).statusCode, 502); assert.equal(calls.length, 2);
});

test("fresh UUIDs cannot bypass global rate or bounded ledger", async () => {
  let at = 1_000_000; const { send } = harness({ now: () => at });
  for (let i = 0; i < 256; i++) {
    if (i && i % 30 === 0) at += 60_000;
    assert.equal((await send(payload({ offerId: `missing-${i}` }), origin)).statusCode, 400);
    if (i === 29) assert.equal((await send(payload({ offerId: "limited" }), origin)).statusCode, 429);
  }
  assert.equal((await send(payload({ offerId: "ledger-full" }), origin)).statusCode, 429);
  at += 600_001;
  assert.equal((await send(payload(), origin)).statusCode, 200, "Expired entries can be reclaimed");
});

test("public handler isolates event+PII, content type, oversized/base64 body from all lead sinks", async () => {
  const previous = process.env.ALLOWED_ORIGINS; process.env.ALLOWED_ORIGINS = origin;
  const calls = []; mock.method(global, "fetch", async url => { calls.push(url); throw Error("No outbound requests allowed"); });
  const event = (body, type = "application/json") => ({ httpMethod: "POST", headers: { origin, "content-type": type }, body: JSON.stringify(body) });
  try {
    assert.equal((await handler(event(payload({ contact: "private", consent: true })))).statusCode, 400);
    assert.equal((await handler(event(payload({ event: "unknown" })))).statusCode, 400);
    assert.equal((await handler(event(payload(), "text/plain"))).statusCode, 415);
    const large = event(payload({ padding: "x".repeat(66000) }));
    assert.equal((await handler(large)).statusCode, 413);
    assert.equal((await handler({ ...large, body: Buffer.from(large.body).toString("base64"), isBase64Encoded: true })).statusCode, 413);
    assert.deepEqual(calls, []);
  } finally { if (previous === undefined) delete process.env.ALLOWED_ORIGINS; else process.env.ALLOWED_ORIGINS = previous; }
});
