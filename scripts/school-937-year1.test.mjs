import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {composeSchool937Year1,school937Year1Identities} from './lib/school-937-year1-source.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const base=read('scripts/fixtures/annual-74-before-937-year1/source.json');
const addition=read('apps/web/content/annual-additions/school-937-year1.json');
const current=read('apps/web/content/year-schedule.generated.json');
test('append four exact Wednesday identities and preserve all74 source records',()=>{
 const composed=composeSchool937Year1(base,addition);
 assert.deepEqual(composed,current);assert.equal(composed.groups.length,78);
 assert.deepEqual(composed.groups.slice(0,74),base.groups);assert.deepEqual(composed.locations,base.locations);
 assert.deepEqual(composed.groups.slice(74).map(g=>g.id),school937Year1Identities.slice(0,4).map(r=>r[0]));
 const reordered=Object.fromEntries(Object.entries(base).reverse());
 assert.deepEqual(composeSchool937Year1(reordered,addition),composed,'JSON property order cannot change source revision');
});
test('wrong school, duplicate identity, year, time, card, private fields and preimage fail closed',()=>{
 for(const mutate of [a=>a.groups[0].cardId='1049844',a=>a.groups[0].listingId='2573569',a=>a.groups[1].groupCode=a.groups[0].groupCode,
  a=>a.groups[0].studyYear=2,a=>a.groups[0].slots[0].weekday='Пятница',a=>a.groups[0].address+=' корпус2',
  a=>a.groups[0].freeSeats=13,a=>a.groups[0].phone='PRIVATE',a=>a.groups[0].refreshedAt='invalid']){
  const bad=structuredClone(addition);mutate(bad);assert.throws(()=>composeSchool937Year1(base,bad));
 }
 const bad=structuredClone(base);bad.groups[0].teacher='Changed';assert.throws(()=>composeSchool937Year1(bad,addition));
});
test('compiled eight groups retain owner facts, exact booking identities and zero enrolment',()=>{
 const snapshot=read('apps/web/data/offers-snapshot.json');
 const all=Object.values(snapshot.offersByQuest).flat();assert.equal(new Set(all.map(o=>o.id)).size,all.length);
 const rows=all.filter(o=>o.venueSlug==='school-937-marshala-zakharova-25');assert.equal(rows.length,8);
 for(const [i,[code,card,listing,year,start,end]] of school937Year1Identities.entries()){
  const o=rows.find(o=>o.id===`year:${code}`);assert.ok(o);
  assert.equal(o.annual.studyYear,year);assert.equal(o.annual.listingId,listing);
  assert.equal(o.mosBookingUrl,`https://www.mos.ru/pgu2/activity/card/${card}`);
  assert.deepEqual(o.weeklySlots,[{weekday:year===1?'Среда':'Пятница',start,end}]);
  assert.equal(o.annual.teacher,'Локтеева Ирина Дмитриевна');assert.equal(o.annual.teacherSourceConflict,true);
  assert.deepEqual([o.annual.ageMin,o.annual.ageMax],[6,13]);
  assert.equal(o.annual.lessonPrice,1000);assert.equal(o.annual.coursePrice,36000);
  assert.equal(o.annual.freeSeats,[7,11,12,8,6,10,12,11][i]);assert.equal(o.enrolled,12-o.annual.freeSeats);
 }
 const before=read('scripts/fixtures/annual-74-before-937-year1/offers.json');
 const owned=new Set(school937Year1Identities.map(r=>`year:${r[0]}`));
 for(const [course,os] of Object.entries(before.offersByQuest))for(const old of os){
  const next=snapshot.offersByQuest[course].find(o=>o.id===old.id);assert.ok(next);
  if(owned.has(old.id))continue;
  if(old.annual)old.annual.sourceSha256=next.annual.sourceSha256;
  assert.deepEqual(next,old,'unrelated offer changed: '+old.id);
 }
});
