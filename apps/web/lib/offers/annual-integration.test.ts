import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { questSchema, venueSchema, worldSchema } from "../schemas";
import { getSchoolScopes } from "./agenda";
import { buildSiteScopeCards } from "../sites/scope-card";
import { getScheduleBookingMode, getScheduleDisplayStatus, getScheduleCapacity } from "./schedule-board";
import { projectAnnualWorkspace } from "../year-schedule";
import { offersSnapshotV1ToScheduleV2 } from "../data/v2/v1-to-v2";
import { scheduleV2ToOffersSnapshotV1 } from "../data/v2/v2-to-v1";
import { scheduleSnapshotV2Schema } from "../data/v2/site-snapshot";
import { parseOffersSnapshot, isUsableOffersSnapshot } from "./snapshot-parse";
import { weeklySlotSchema } from "./annual-schedule";
import { fetchOffersSnapshotClient, publicOffersSnapshotUrl } from "./snapshot-client";

const read = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));
const snapshot = parseOffersSnapshot(read("data/offers-snapshot.json"));
const venues = venueSchema.array().parse(read("data/v2/map-snapshot.json").venues);
const quests = questSchema.array().parse(read("data/v2/catalog-snapshot.json").courses.map((q: {slug:string}) => ({...q, offers:snapshot.offersByQuest[q.slug]??[]})));

test("shared catalogue projects all annual groups and exact campuses", () => {
  const view = projectAnnualWorkspace(quests, venues);
  assert.equal(view.groups.length,51);
  assert.equal(view.groups.flatMap(g=>g.slots).length,52);
  assert.equal(view.locations.length,8);
  assert.equal(view.groups.filter(g=>g.status==="closed").length,5);
  assert.equal(quests.filter(q=>q.format==="year").length,4);
  for(const location of view.locations) {
    assert.ok(location.schoolScopeSlug);
    assert.ok(location.latitude && location.latitude>55 && location.latitude<57);
    assert.ok(location.longitude && location.longitude>37 && location.longitude<39);
  }
  for(const group of view.groups.filter(g=>g.limitedSource)) {
    assert.equal(group.totalSeats,null);
    assert.equal(group.freeSeats,null);
  }
});

test("V1/V2 round trip preserves all weekly slots and dated metadata", () => {
  // Validate new annual events through V2. Legacy media paths use the V1
  // compatibility loader and do not satisfy V2's absolute-URL media contract.
  const v2 = scheduleSnapshotV2Schema.parse(offersSnapshotV1ToScheduleV2({...snapshot,offersByQuest:{shmi:snapshot.offersByQuest.shmi}}));
  const roundTrip = scheduleV2ToOffersSnapshotV1(v2);
  for (const original of snapshot.offersByQuest.shmi) {
    const restored = roundTrip.offersByQuest.shmi.find(o=>o.id===original.id);
    assert.deepEqual(restored?.weeklySlots,original.weeklySlots);
    assert.deepEqual(restored?.annual,original.annual);
    assert.equal(v2.events.find(e=>e.id===original.id)?.registration.allowBooking,original.annual?.admission!=="closed");
  }
});

test("negative boundary: malformed slots and orphan campus fail", () => {
  for(const slot of [{weekday:"Tomorrow",start:"10:00",end:"11:00"},{weekday:"Среда",start:"12:00",end:"11:00"}]) assert.equal(weeklySlotSchema.safeParse(slot).success,false);
  assert.throws(()=>projectAnnualWorkspace(quests,[]),/Unknown location/);
});

test("shared site/map selectors include all eight campuses and closed groups cannot book", () => {
  const cards=buildSiteScopeCards({scopes:getSchoolScopes(venues),quests,venues,worlds:worldSchema.array().parse(read("data/v2/catalog-snapshot.json").worlds)});
  const annual=projectAnnualWorkspace(quests,venues);
  assert.equal(new Set(annual.locations.map(l=>l.schoolScopeSlug)).size,6);
  for(const location of annual.locations) {
    const card=cards.find(c=>c.slug===location.schoolScopeSlug);
    assert.ok(card);
    assert.ok(card.courseSlugs.includes("shmi"));
    assert.ok(card.campuses.some(c=>c.slug===location.id && c.latitude && c.longitude));
  }
  for(const offer of snapshot.offersByQuest.shmi) {
    if(offer.annual?.admission==="closed") {
      assert.equal(getScheduleDisplayStatus(offer,new Date("2026-09-08")),"Приём закрыт");
      assert.equal(getScheduleBookingMode(offer,"Приём закрыт").kind,"disabled");
    }
    if(offer.annual?.limitedSource) assert.equal(getScheduleCapacity(offer),null);
  }
});

test("valid empty snapshot differs from unavailable data", () => {
  assert.equal(isUsableOffersSnapshot(parseOffersSnapshot({version:1,generatedAt:"2026-09-08T00:00:00Z",offersByQuest:{}})),true);
  assert.equal(isUsableOffersSnapshot(parseOffersSnapshot({broken:true})),false);
});

test("local preview URL, failed fetch and successful empty response", async () => {
  const old=process.env.NEXT_PUBLIC_OFFERS_SNAPSHOT_URL, originalFetch=globalThis.fetch;
  try {
    process.env.NEXT_PUBLIC_OFFERS_SNAPSHOT_URL="/data/offers-snapshot.json";
    assert.equal(publicOffersSnapshotUrl(),"/data/offers-snapshot.json");
    globalThis.fetch=async()=>new Response("private diagnostic",{status:503});
    await assert.rejects(fetchOffersSnapshotClient(),/Не удалось обновить расписание/);
    globalThis.fetch=async()=>Response.json({version:1,generatedAt:"2026-09-08T00:00:00Z",offersByQuest:{}});
    assert.equal(isUsableOffersSnapshot(await fetchOffersSnapshotClient()),true);
    for(const url of ["javascript:alert(1)","http://example.com/data.json","//example.com/data.json"]) {
      process.env.NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=url;
      assert.throws(publicOffersSnapshotUrl);
    }
  } finally {
    globalThis.fetch=originalFetch;
    if(old===undefined)delete process.env.NEXT_PUBLIC_OFFERS_SNAPSHOT_URL; else process.env.NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=old;
  }
});
