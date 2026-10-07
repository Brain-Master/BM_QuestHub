import assert from "node:assert/strict";
import { test } from "node:test";
import { leadAttempt } from "./lead-attempt";
import { resolveLeadEndpoint } from "./lead-endpoint";
test("retry identity survives timestamps and storage reload, changes with payload", async () => {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  const first = await leadAttempt({ contact: "test@example.invalid", consentAt: "old" }, storage);
  assert.equal(await leadAttempt({ consentAt: "new", contact: "test@example.invalid" }, storage), first);
  assert.notEqual(await leadAttempt({ contact: "other@example.invalid" }, storage), first);
  assert.ok([...data.keys()].every(key => /^bm-lead-attempt:[a-f\d]{64}$/.test(key)));
  assert.ok(!JSON.stringify([...data]).includes("example.invalid"));
});
test("only legacy/default endpoint migrates; explicit custom endpoint remains", () => {
  assert.equal(resolveLeadEndpoint("https://functions.yandexcloud.net/d4ellekng389grh5rck4/"), "https://space.b-master.pro/api/leads");
  assert.equal(resolveLeadEndpoint(""), "https://space.b-master.pro/api/leads");
  assert.equal(resolveLeadEndpoint("https://example.invalid/receiver"), "https://example.invalid/receiver");
});
