import type {VenueOffer,Venue} from '../schemas';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSchoolProfile} from '../../content/school-profiles';
import {reviewedTeacher,reviewedStudyYear} from '../../content/annual-group-overrides';
import {annualMosRefreshSchema} from './annual-schedule';
import {getScheduleBookingMode} from './schedule-board';
const read=(p:string)=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8'));
const addition=read('content/annual-additions/school-1539.json');
const all=Object.values(read('data/offers-snapshot.json').offersByQuest).flat() as VenueOffer[];
const registry=annualMosRefreshSchema.parse(read('content/annual-mos-refresh.generated.json'));
test('school1539 contains four exact groups, owner teacher, source identities and distinct admission deadlines',()=>{
 const rows=all.filter(o=>o.venueSlug==='school-1539-malomoskovskaya-7');assert.equal(rows.length,4);
 for(const [i,g] of addition.groups.entries()){
  const o=rows.find(o=>o.id==='year:'+g.groupCode);assert.ok(o);assert.equal(o.annual!.studyYear,1);assert.equal(o.annual!.teacher,'Тихомирова Марина Дмитриевна');assert.equal(o.annual!.teacherSourceConflict,true);assert.equal(registry.groups[g.groupCode].teacher,'Варфоломеева Алина Александровна');assert.equal(o.annual!.listingId,g.listingId);assert.equal(o.mosBookingUrl,g.link);assert.deepEqual(o.weeklySlots,[{weekday:'Пятница',start:`${14+i}:30`,end:`${15+i}:29`}]);assert.equal(o.startDate,'2026-12-01');assert.equal(o.endDate,'2027-05-31');assert.equal(o.annual!.ageMin,6);assert.equal(o.annual!.ageMax,14);assert.equal(o.annual!.totalSeats,15);assert.equal(o.annual!.freeSeats,15);assert.equal(o.annual!.lessonPrice,1000);assert.equal(o.annual!.coursePrice,24000);assert.ok(o.scheduleCard!.description.includes(i===3?'31.01.2027':'28.02.2027'));assert.equal(getScheduleBookingMode(o,'Идёт набор').kind,'mos');
 }
 assert.equal(registry.expectedGroups,98);assert.equal(all.reduce((n,o)=>n+(o.annual?.legacyReservation?.places??0),0),51);
 assert.equal(reviewedTeacher('school-1539',1,'UNKNOWN'),undefined);assert.equal(reviewedStudyYear('school-1539','UNKNOWN'),undefined);
});
test('school1539 exact campus photo, map and public profile are present without adding another school building',()=>{
 const venues=read('data/v2/map-snapshot.json').venues.filter((v:Venue)=>v.schoolScopeSlug==='school-1539');assert.equal(venues.length,1);const v=venues[0];assert.equal(v.address,'Маломосковская ул., 7');assert.equal(v.latitude,55.813850);assert.equal(v.longitude,37.644522);assert.equal(v.metro,'Алексеевская');assert.equal(v.photos.length,1);assert.equal(v.listedOnSites,true);assert.ok(fs.existsSync(new URL('../../public'+v.photos[0].url,import.meta.url)));const p=getSchoolProfile('school-1539');assert.equal(p.website,'https://gym1539sv.mskobr.ru/');assert.equal(Object.keys(p.campuses).length,1);
});
