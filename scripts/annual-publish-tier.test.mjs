import { test } from "node:test";
import assert from "node:assert/strict";
import { annualOverlayArgs, selectAnnualOutputs } from "./annual-publish-tier.mjs";

const hot = { offersByQuest: { legacy: [{ id: "existing" }] } };
const cold = { courses: [{ slug: "existing" }] };
const inputs = { "data/offers-snapshot.json": hot, "data/v2/catalog-snapshot.json": cold, "data/v2/detail/shmi.json": { course: "shmi" } };
test("hot publication selects only schedule and preserves payload identity", () => {
  assert.deepEqual(annualOverlayArgs("hot"), ["--write", "--tier=hot"]);
  assert.deepEqual(Object.keys(selectAnnualOutputs(inputs, "hot")), ["data/offers-snapshot.json"]);
  assert.equal(selectAnnualOutputs(inputs, "hot")["data/offers-snapshot.json"], hot);
});
test("cold publication never includes the live schedule", () => {
  assert.deepEqual(annualOverlayArgs("cold"), ["--write", "--tier=cold"]);
  const result = selectAnnualOutputs(inputs, "cold");
  assert.deepEqual(Object.keys(result), ["data/v2/catalog-snapshot.json", "data/v2/detail/shmi.json"]);
  assert.equal(result["data/v2/catalog-snapshot.json"], cold);
});
test("full local generation retains all outputs without mutating input", () => {
  const before = structuredClone(inputs);
  assert.deepEqual(selectAnnualOutputs(inputs), inputs);
  assert.deepEqual(inputs, before);
});
test("invalid tiers and output paths fail closed", () => {
  assert.throws(() => annualOverlayArgs("all"));
  assert.throws(() => selectAnnualOutputs(inputs, "unknown"));
  assert.throws(() => selectAnnualOutputs({ "secret/file": {} }, "hot"));
});
