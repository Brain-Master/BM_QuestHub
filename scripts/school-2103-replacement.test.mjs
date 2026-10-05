import fs from 'node:fs';import assert from 'node:assert/strict';import {test} from 'node:test';
import {composeSchool2103Replacement,replacementIdentities} from './lib/school-2103-replacement-source.mjs';
import {isRetiredAnnualGroup,canonicalAnnualOfferId} from '../apps/web/content/annual-retirements.mjs';
import {school2103Replacements} from '../apps/web/content/school-2103-transfer.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const base=read('scripts/fixtures/annual-78-before-2103/source.json'),addition=read('apps/web/content/annual-additions/school-2103-replacement.json');
test('append11 exact cards; preserve78 historical groups and9 explicit aliases',()=>{
 const out=composeSchool2103Replacement(base,addition);assert.deepEqual(out,read('apps/web/content/year-schedule.generated.json'));assert.equal(out.groups.length,89);assert.deepEqual(out.groups.slice(0,78),base.groups);
 assert.equal(out.groups.filter(g=>!isRetiredAnnualGroup(g)).length,67);
 for(const [old,current]of Object.entries(school2103Replacements)){assert.equal(canonicalAnnualOfferId('year:'+old),'year:'+current);assert.ok(isRetiredAnnualGroup(base.groups.find(g=>g.id===old)));}
 assert.equal(canonicalAnnualOfferId('year:К2211-26'),'year:К2211-26');
 assert.equal(addition.legacyOccupancy.reduce((n,r)=>n+r.occupied,0),51);
});
test('identity, slot, school, reservation provenance and preimage tampering rejected',()=>{
 for(const mutate of [a=>a.groups[0].cardId='1071199',a=>a.groups[0].listingId='2586503',a=>a.groups[0].slots[0].start='13:00',a=>a.groups[0].locationId='LOC-010',a=>a.groups[0].organization='Another school',a=>a.groups[0].phone='PRIVATE',a=>a.legacyOccupancy[0].occupied=0,a=>a.legacyOccupancy[0].newGroupCode='К3129-26',a=>a.legacyOccupancy[0].oldCardId='1']){const a=structuredClone(addition);mutate(a);assert.throws(()=>composeSchool2103Replacement(base,a));}
 const bad=structuredClone(base);bad.groups[0].title='changed';assert.throws(()=>composeSchool2103Replacement(bad,addition));
});
test('compiled source: reserves attach only exact new cards; all unrelated records preserved',()=>{
 const registry=read('apps/web/content/annual-mos-refresh.generated.json'),oldRegistry=read('scripts/fixtures/annual-78-before-2103/registry.json');
 for(const [code,row]of Object.entries(oldRegistry.groups))assert.deepEqual(registry.groups[code],row);
 assert.equal(registry.expectedGroups,89);assert.equal(Object.keys(registry.groups).length,81);
 const snapshot=read('apps/web/data/offers-snapshot.json'),before=read('scripts/fixtures/annual-78-before-2103/offers.json');
 const all=Object.values(snapshot.offersByQuest).flat(),newCodes=new Set(replacementIdentities.map(r=>r[0]));
 const current=all.filter(o=>newCodes.has(o.annual?.groupCode));assert.equal(current.length,11);
 assert.equal(current.reduce((n,o)=>n+(o.annual.legacyReservation?.places??0),0),51);
 assert.equal(current.filter(o=>o.annual.audienceLabel==='Только 1 класс').length,3);
 for(const [code,card,listing,year]of replacementIdentities){const o=current.find(o=>o.annual.groupCode===code);assert.equal(o.mosBookingUrl,`https://www.mos.ru/pgu2/activity/card/${card}`);assert.equal(o.annual.listingId,listing);assert.equal(o.annual.studyYear,year);assert.equal(o.annual.lessonPrice,1000);assert.equal(o.enrolled,o.annual.totalSeats-o.annual.freeSeats);}
 for(const os of Object.values(before.offersByQuest))for(const old of os){const next=all.find(o=>o.id===old.id);assert.ok(next);if(old.annual)old.annual.sourceSha256=next.annual.sourceSha256;if(school2103Replacements[old.annual?.groupCode])old.scheduleCard.isArchived=true;assert.deepEqual(next,old,old.id);}
});
