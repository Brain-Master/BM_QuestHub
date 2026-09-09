import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { questSchema, venueSchema, worldSchema } from "../schemas";
import { buildAgendaItems, resolveSchoolScope } from "./agenda";
import { buildScheduleBoardItem } from "./schedule-board";
import { parseOffersSnapshot } from "./snapshot-parse";
import { changeFinderState, finderAgeLabel, finderItemMatches, finderQuery, groupFinderWeek, itemStudyYear, readFinderState } from "./course-finder";

const read = (path: string) => JSON.parse(fs.readFileSync(path, "utf8"));
const catalog = read("data/v2/catalog-snapshot.json");
const offers = parseOffersSnapshot(read("data/offers-snapshot.json"));
const quests = questSchema.array().parse(catalog.courses.map((quest: { slug: string }) => ({ ...quest, offers: offers.offersByQuest[quest.slug] ?? [] })));
const venues = venueSchema.array().parse(read("data/v2/map-snapshot.json").venues);
const items = buildAgendaItems({ quests, venues, worlds: worldSchema.array().parse(catalog.worlds) }).map(item => buildScheduleBoardItem(item, item.venue.schoolScopeSlug ?? item.venue.slug, new Date("2026-09-09")));
const all = readFinderState(new URLSearchParams());
const annual = items.filter(item => finderItemMatches(item, all));

test("school QR starts at all campuses; general agenda is a full catalogue", () => {
  const qr = readFinderState(new URLSearchParams(), "school-2044");
  assert.equal(qr.view, "wizard"); assert.equal(qr.step, "campus"); assert.equal(qr.venue, "all");
  assert.equal(all.view, "catalogue");
  assert.equal(readFinderState(new URLSearchParams("view=wizard")).step, "school");
  assert.equal(resolveSchoolScope(venues, "2044")?.slug, "school-2044");
});
test("fixed route scope defeats conflicting queries, unknown IDs fail closed", () => {
  const fixed = readFinderState(new URLSearchParams("school=evil&venue=foreign&campus=other"), "school-2044", "school-2044-campus-169b");
  assert.equal(fixed.school, "school-2044"); assert.equal(fixed.venue, "school-2044-campus-169b");
  for (const query of ["school=missing", "venue=missing", "programme=missing"]) {
    assert.equal(items.filter(item => finderItemMatches(item, readFinderState(new URLSearchParams(query)))).length, 0);
  }
  assert.equal(readFinderState(new URLSearchParams(`school=${"x".repeat(1000)}`)).school.length, 160);
});
test("public selection roundtrips across views; campus changes retain other filters", () => {
  const state = readFinderState(new URLSearchParams("view=wizard&step=results&school=school-2044&venue=one&programme=shmi&level=2&age=11&day=3&grouping=programmes"));
  const next = changeFinderState(state, { venue: "two", view: "catalogue" });
  assert.equal(next.programme, "shmi"); assert.equal(next.age, "11"); assert.equal(next.day, "3"); assert.equal(next.level, "2");
  assert.deepEqual(readFinderState(new URLSearchParams(finderQuery(next))), next);
  assert.equal(changeFinderState(next, { school: "another" }).venue, "all");
  assert.equal(changeFinderState(next, { programme: "projects" }).level, "all");
});
test("direct offer skips questions; numeric parameters are allowlisted", () => {
  assert.equal(readFinderState(new URLSearchParams("view=wizard&offer=year:К1981-26&step=campus")).step, "results");
  const state = readFinderState(new URLSearchParams("age=-99&day=8&programme=shmi&level=2044"));
  assert.equal(state.age, "all"); assert.equal(state.day, "all"); assert.equal(state.level, "all");
});
test("51 real groups expand to 52 weekly slots without changing identities", () => {
  assert.equal(annual.length, 51);
  const rows = groupFinderWeek(annual).flatMap(day => day.rows);
  assert.equal(rows.length, 52); assert.equal(new Set(rows.map(row => row.item.offer.id)).size, 51);
  assert.equal(new Set(rows.map(row => row.key)).size, 52);
  assert.deepEqual(rows.filter(row => row.item.offer.id === "year:К1981-26").map(row => row.key.split(":").slice(2, 3)[0]), ["Вторник", "Четверг"]);
  assert.equal(new Set(annual.map(item => item.venue.slug)).size, 8);
  assert.equal(annual.filter(item => item.offer.annual?.admission === "closed").length, 5);
  assert.ok(annual.filter(item => item.offer.annual?.admission === "closed").every(item => item.variants.every(variant => variant.bookingMode.kind === "disabled")));
});
test("canonical programme registry includes empty programmes; study years never inferred", () => {
  assert.equal(quests.filter(quest => quest.format === "year").length, 4);
  for (const programme of ["projects", "it-academy", "olympiad-league"]) assert.equal(items.filter(item => finderItemMatches(item, { ...all, programme })).length, 0);
  assert.deepEqual([1, 2, 3, null].map(year => annual.filter(item => itemStudyYear(item) === year).length), [6, 5, 0, 40]);
});
test("age uses annual metadata, unknown bounds stay visible with explicit wording", () => {
  const original = annual[0]; assert.ok(original.offer.annual);
  const oneBound = { ...original, offer: { ...original.offer, annual: { ...original.offer.annual, ageMin: 8, ageMax: null } } };
  assert.equal(finderItemMatches(oneBound, { ...all, age: "7" }), false);
  assert.equal(finderItemMatches(oneBound, { ...all, age: "8" }), true);
  assert.match(finderAgeLabel(oneBound), /уточняется/);
  const unknown = { ...oneBound, offer: { ...oneBound.offer, annual: { ...oneBound.offer.annual, ageMin: null, ageMax: null } } };
  assert.equal(finderAgeLabel(unknown), "Возраст уточняется");
  assert.equal(finderItemMatches(unknown, { ...all, age: "12" }), true);
});
test("missing weekly slots stay unknown, not fabricated from compatibility times", () => {
  const item = { ...annual[0], offer: { ...annual[0].offer, weeklySlots: [] } };
  assert.equal(groupFinderWeek([item])[0].day, "Время уточняется");
  assert.equal(groupFinderWeek([item])[0].rows[0].start, null);
  assert.equal(finderItemMatches(item, { ...all, day: "2" }), false);
  assert.equal(groupFinderWeek([], "all").length, 0);
});
test("presentation changes keep selected offer, wizard completion roundtrips", () => {
  const selected = readFinderState(new URLSearchParams("view=wizard&step=results&offer=year:test&programme=shmi"));
  assert.equal(selected.completed, "yes");
  assert.equal(changeFinderState(selected, { grouping: "programmes" }).offer, "year:test");
  const catalogue = changeFinderState(selected, { view: "catalogue" });
  assert.equal(readFinderState(new URLSearchParams(finderQuery(catalogue))).completed, "yes");
  assert.equal(changeFinderState(selected, { day: "2" }).offer, "");
  assert.equal(changeFinderState(selected, { step: "campus" }).offer, "");
});
