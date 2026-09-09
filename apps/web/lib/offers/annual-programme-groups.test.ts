import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { questSchema,venueSchema,worldSchema } from "../schemas";
import { buildAgendaItems } from "./agenda";
import { buildScheduleBoardItem } from "./schedule-board";
import { groupAnnualProgrammes } from "./annual-programme-groups";
import { parseOffersSnapshot } from "./snapshot-parse";
const read=(p:string)=>JSON.parse(fs.readFileSync(p,"utf8"));
const catalog=read("data/v2/catalog-snapshot.json");
const offers=parseOffersSnapshot(read("data/offers-snapshot.json"));
const quests=questSchema.array().parse(catalog.courses.map((q:{slug:string})=>({...q,offers:offers.offersByQuest[q.slug]??[]})));
const items=buildAgendaItems({quests,venues:venueSchema.array().parse(read("data/v2/map-snapshot.json").venues),worlds:worldSchema.array().parse(catalog.worlds)}).map(i=>buildScheduleBoardItem(i,undefined,new Date("2026-09-09")));
test("30 school source names collapse into one programme, not 51 course cards",()=>{
 const groups=groupAnnualProgrammes(items);
 assert.equal(groups.length,1);assert.equal(groups[0].slug,"shmi");
 assert.equal(groups[0].title,"Школа Молодого IT-Инженера");
 assert.equal(groups[0].campuses.length,8);
 const rows=groups.flatMap(g=>g.campuses.flatMap(c=>c.items));
 assert.equal(rows.length,51);assert.equal(new Set(rows.map(r=>r.offer.id)).size,51);
 assert.equal(rows.flatMap(r=>r.offer.weeklySlots??[]).length,52);
 for(const r of rows){assert.ok(r.offer.mosBookingUrl);assert.equal(r.programFilterLabel,"Школа Молодого IT-Инженера");assert.ok(!r.displayTitle.includes("(платно)"));}
});
test("four canonical programmes remain distinct even with identical presentation titles",()=>{
 const original=items.find(i=>i.quest.slug==="shmi");assert.ok(original);
 const synthetic=quests.filter(q=>q.format==="year").map(q=>({...original,quest:q,displayTitle:"Same source title",offer:{...original.offer,id:`synthetic:${q.slug}`}}));
 assert.deepEqual(new Set(groupAnnualProgrammes(synthetic).map(g=>g.slug)),new Set(["shmi","it-academy","olympiad-league","projects"]));
 assert.equal(groupAnnualProgrammes(items.filter(i=>i.quest.format!=="year")).length,0);
});
