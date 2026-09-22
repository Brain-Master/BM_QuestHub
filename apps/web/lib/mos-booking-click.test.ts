import test from "node:test";
import assert from "node:assert/strict";
import { createMosClickNotifier } from "./mos-booking-click";
const target = { questSlug: "shmi", offerId: "year:К1", venueSlug: "school-2103", variantId: "main" };
test("click is synchronous, minimal, credential/referrer-free and deduplicated", async () => {
  const calls: RequestInit[] = []; let time = 100;
  const notify = createMosClickNotifier("https://example.test/click", (async (_url, init) => { calls.push(init!); return new Response(); }) as typeof fetch, () => time, () => "test-event-id");
  assert.equal(notify({ ...target, contact: "not serialized" } as typeof target), undefined);
  notify(target); assert.equal(calls.length, 1);
  const req = calls[0]; assert.equal(req.keepalive, true); assert.equal(req.credentials, "omit");
  assert.equal(req.referrerPolicy, "no-referrer"); assert.equal(req.redirect, "error");
  assert.deepEqual(JSON.parse(String(req.body)), { event: "booking.mos_click", eventId: "test-event-id", ...target });
  time += 30001; notify(target); assert.equal(calls.length, 2);
  await new Promise(resolve => setImmediate(resolve));
});
test("missing endpoint, sync throw, rejected network or broken UUID never throw or retry", async () => {
  let calls = 0;
  const fail = (() => { calls++; throw Error("network"); }) as typeof fetch;
  createMosClickNotifier("", fail)(target); assert.equal(calls, 0);
  const notify = createMosClickNotifier("https://example.test", fail, Date.now, () => "id");
  assert.doesNotThrow(() => notify(target)); notify(target); assert.equal(calls, 1);
  createMosClickNotifier("https://example.test", fail, Date.now, () => { throw Error("crypto"); })(target);
  assert.equal(calls, 1);
  const reject = createMosClickNotifier("https://example.test", (() => { calls++; return Promise.reject(Error("offline")); }) as typeof fetch, Date.now, () => "id");
  reject(target); await new Promise(resolve => setImmediate(resolve)); reject(target); assert.equal(calls, 2);
});
