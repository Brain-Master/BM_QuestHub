import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {questSchema,venueSchema,worldSchema} from '../schemas';
import {parseOffersSnapshot} from './snapshot-parse';
import {mergeOffersIntoQuests} from './merge-offers';
import {buildAgendaItems} from './agenda';
import {buildScheduleBoardItem,getScheduleCapacity} from './schedule-board';
import {readFinderState,finderItemMatches,finderChoices} from './course-finder';
import {projectAnnualWorkspace} from '../year-schedule';
import {reviewedStudyYear,reviewedTeacher,reviewedAges} from '../../content/annual-group-overrides';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=parseOffersSnapshot(read('data/offers-snapshot.json'));
const catalog=read('data/v2/catalog-snapshot.json');
const quests=questSchema.array().parse(catalog.courses.map((q:{slug:string})=>({...q,offers:snapshot.offersByQuest[q.slug]??[]})));
const venues=venueSchema.array().parse(read('data/v2/map-snapshot.json').venues);
const items=buildAgendaItems({quests,venues,worlds:worldSchema.array().parse(catalog.worlds)}).map(i=>buildScheduleBoardItem(i,undefined,new Date('2026-09-23')));
test('seven1212 groups retain unique exact cards, SHMI1 and confirmed teacher/capacity',()=>{
 const expected=[['К4609-26','984756',14,20],['К4613-26','985251',3,10],['К4611-26','985173',2,10],['К4615-26','985282',4,10],['К4617-26','985781',3,15],['К4618-26','985925',7,10],['К4619-26','985956',7,10]] as const;
 const rows=snapshot.offersByQuest.shmi.filter(o=>o.venueSlug.startsWith('school-1212-'));
 assert.equal(rows.length,7);assert.equal(new Set(rows.map(o=>o.mosBookingUrl)).size,7);
 for(const [code,card,free,total]of expected){
  const o=rows.find(o=>o.annual?.groupCode===code)!;assert.ok(o);
  assert.equal(o.mosBookingUrl,`https://www.mos.ru/pgu2/activity/card/${card}`);
  assert.equal(o.annual?.studyYear,1);assert.equal(o.annual?.teacher,'Толмачева Василиса Владимировна');
  assert.equal(o.annual?.freeSeats,free);assert.equal(o.annual?.totalSeats,total);
  assert.equal(o.annual?.admission,'open');assert.equal(o.annual?.lessonPrice,1000);assert.equal(o.annual?.coursePrice,45000);
  const capacity=getScheduleCapacity(o);assert.ok(capacity);assert.equal(capacity.booked,total-free);
  assert.equal(o.endDate,code==='К4611-26'?'2027-03-31':'2027-05-31');
 }
 const first=rows.find(o=>o.id==='year:К4609-26')!;
 assert.deepEqual(first.weeklySlots,[{weekday:'Четверг',start:'13:30',end:'14:15'}]);
 assert.deepEqual([first.annual?.ageMin,first.annual?.ageMax],[6,8]);assert.equal(first.annual?.listingId,'2533333');
});
test('937 four groups belong to25 not25k2; raw age/teacher stay separate',()=>{
 const rows=snapshot.offersByQuest.shmi.filter(o=>o.venueSlug.startsWith('school-937-'));
 const registry=read('content/annual-mos-refresh.generated.json');
 assert.equal(rows.length,4);
 for(const o of rows){
  assert.equal(o.venueSlug,'school-937-marshala-zakharova-25');assert.equal(o.annual?.studyYear,2);
  assert.equal(o.annual?.teacher,'Локтеева Ирина Дмитриевна');
  assert.deepEqual([o.annual?.ageMin,o.annual?.ageMax],[6,13]);
  const raw=registry.groups[o.annual!.groupCode!];assert.equal(raw.ageMax,18);assert.equal(raw.teacher,'Балукова Мария Михайловна');
 }
 assert.equal(reviewedStudyYear('school-1212','К4619-26'),1);
 assert.equal(reviewedTeacher('school-937',2,'not-reviewed'),undefined);
 assert.equal(reviewedAges('school-17','К2215-26'),undefined);
 assert.equal(projectAnnualWorkspace(quests,venues).groups.length,61);
});
test('finder exposes correct school/year/age facets and hides wrong campuses',()=>{
 const state=readFinderState(new URLSearchParams('school=school-1212&programme=shmi'));
 assert.equal(items.filter(i=>finderItemMatches(i,state)).length,7);
 assert.deepEqual(finderChoices(items,state,'level',['1','2','3']),['1']);
 const s937={...state,school:'school-937'};
 assert.equal(items.filter(i=>finderItemMatches(i,s937)).length,4);
 assert.equal(items.filter(i=>finderItemMatches(i,{...s937,age:'14'})).length,0);
 assert.equal(items.filter(i=>finderItemMatches(i,{...s937,venue:'school-937-orekhovo'})).length,0);
});
test('delayed old or incomplete annual snapshot cannot erase confirmed additions',()=>{
 const old=parseOffersSnapshot(read('../../scripts/fixtures/annual-69-before-1517/offers.json'));
 for(const incoming of [old,{...snapshot,offersByQuest:{...snapshot.offersByQuest,shmi:snapshot.offersByQuest.shmi.slice(1)}}]){
  assert.deepEqual(mergeOffersIntoQuests(quests,incoming).find(q=>q.slug==='shmi')!.offers,snapshot.offersByQuest.shmi);
 }
 const fresh=structuredClone(snapshot),o=fresh.offersByQuest.shmi.find(o=>o.id==='year:К4609-26')!;
 o.annual!.refreshedAt='2026-09-24T12:00:00.000Z';o.annual!.freeSeats=13;
 const updated=mergeOffersIntoQuests(quests,fresh);
 assert.equal(updated.find(q=>q.slug==='shmi')!.offers.find(o=>o.id==='year:К4609-26')!.annual!.freeSeats,13);
 assert.equal(mergeOffersIntoQuests(updated,snapshot).find(q=>q.slug==='shmi')!.offers.find(o=>o.id==='year:К4609-26')!.annual!.freeSeats,13);
});
