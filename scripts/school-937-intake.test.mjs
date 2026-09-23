import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {validateProjectedMosCard} from './lib/mos-annual-cards.mjs';
import {composeConfirmedSchools,historical69} from './lib/confirmed-school-source.mjs';
const addition=JSON.parse(fs.readFileSync(new URL('../apps/web/content/annual-additions/school-937.json',import.meta.url)));
const expected=[['К2215-26','1049854','2573579','14:00','14:45',9],['К2216-26','1049859','2573583','15:00','15:45',11],['К2217-26','1049862','2573587','16:00','16:45',12],['К2218-26','1049865','2573589','17:00','17:45',11]];
test('four supplied937 identities preserve exact direct cards and Friday slots',()=>{
 assert.equal(addition.groups.length,4);assert.equal(addition.locations.length,1);
 assert.equal(addition.locations[0].id,'LOC-011');
 assert.equal(new Set(addition.groups.map(g=>g.cardId)).size,4);
 for(const [i,[code,card,listing,start,end,free]] of expected.entries()){
  const g=addition.groups[i];validateProjectedMosCard(g);
  assert.equal(g.groupCode,code);assert.equal(g.cardId,card);assert.equal(g.listingId,listing);
  assert.equal(g.locationId,'LOC-011');assert.equal(g.address,addition.locations[0].address);
  assert.ok(g.address.endsWith('д. 25'));assert.ok(!g.address.includes('корп'));
  assert.deepEqual(g.slots,[{weekday:'Пятница',start,end}]);
  assert.equal(g.lessonPrice,1000);assert.equal(g.coursePrice,36000);
  assert.equal(g.freeSeats,free);assert.equal(g.totalSeats,12);assert.equal(g.status,'open');
  assert.equal(g.courseStart,'2026-09-28');assert.equal(g.courseEnd,'2027-05-31');
  assert.equal(g.link,`https://www.mos.ru/pgu2/activity/card/${card}`);
 }
});
test('source conflicts remain explicit; contact is not silently converted into teacher',()=>{
 assert.equal(addition.ownerContext.contactName,'Локтеева Ирина Дмитриевна');
 assert.deepEqual([addition.ownerContext.ageMin,addition.ownerContext.ageMax],[6,13]);
 for(const g of addition.groups){assert.equal(g.teacher,'Балукова Мария Михайловна');assert.deepEqual([g.ageMin,g.ageMax],[6,18]);}
 assert.deepEqual(addition.unresolved,[]);
 assert.equal(addition.ownerContext.teacher,'Локтеева Ирина Дмитриевна');
 assert.equal(addition.ownerContext.studyYear,2);
 assert.equal(addition.ownerContext.classroom,'103');
 assert.match(addition.programmeTitle,/2-й год/);
});
test('confirmed intake participates in the deterministic74 group source',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('../apps/web/content/year-schedule.generated.json',import.meta.url)));
 const school1212=JSON.parse(fs.readFileSync(new URL('../apps/web/content/annual-additions/school-1212.json',import.meta.url)));
 const composed=composeConfirmedSchools(historical69(source),school1212,addition);
 assert.equal(source.groups.length,74);assert.deepEqual(JSON.parse(JSON.stringify(composed)),source);
 for(const g of addition.groups)assert.ok(source.groups.some(s=>s.id===g.groupCode&&s.link===g.link));
});
