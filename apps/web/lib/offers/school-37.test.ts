import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {reviewedStudyYear,reviewedTeacher,reviewedLessonPrice} from '../../content/annual-group-overrides';
import {getSchoolProfile} from '../../content/school-profiles';
import {parseOffersSnapshot} from './snapshot-parse';
import {resolveSchoolScope} from './agenda';
import {venueSchema} from '../schemas';
import {annualMosRefreshSchema} from './annual-schedule';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const offers=parseOffersSnapshot(read('data/offers-snapshot.json')).offersByQuest.shmi.filter(o=>o.venueSlug==='school-37-michurinsky-28');
const venues=venueSchema.array().parse(read('data/v2/map-snapshot.json').venues);
const cards=['1019233','1019236','1019244','1019286','1019288','1019293','1019299','1019455','1019466'];
test('37: nine groups, canonical6+3 years, weekly45min, correct prices, age, teacher and exact registration',()=>{
  assert.equal(offers.length,9);
  assert.deepEqual([1,2].map(year=>offers.filter(o=>o.annual?.studyYear===year).length),[6,3]);
  for(let i=0;i<9;i++){
    const code=`К${2763+i}-26`,row=offers.find(o=>o.id===`year:${code}`);assert.ok(row);
    const a=row.annual!;const year=i%3===2?2:1;
    assert.equal(a.studyYear,year);assert.equal(row.shiftLabel,`ШМИ · ${year}-й год`);
    assert.equal(a.teacher,'Кузнецова Ольга Максимовна');assert.equal(row.scheduleCard?.teacherName,a.teacher);assert.equal(a.teacherSourceConflict,true);
    assert.equal(a.lessonPrice,1375);assert.equal(a.coursePrice,49500);assert.equal(a.sourceLessonPrice,undefined);
    assert.equal(a.ageMin,6);assert.equal(a.ageMax,13);assert.equal(a.totalSeats,12);assert.equal(a.limitedSource,false);
    assert.equal(row.mosBookingUrl,`https://www.mos.ru/pgu2/activity/card/${cards[i]}`);
    assert.deepEqual(row.weeklySlots,[{weekday:['Среда','Четверг','Пятница'][Math.floor(i/3)],start:['14:15','15:15','16:15'][i%3],end:['15:00','16:00','17:00'][i%3]}]);
  }
});
test('37: pinned editorial overrides cannot bleed into other or future groups; raw teacher stays intact',()=>{
  for(const code of cards.map((_,i)=>`К${2763+i}-26`)){
    assert.equal(reviewedTeacher('school-37',undefined,code),'Кузнецова Ольга Максимовна');
    assert.equal(reviewedTeacher('school-2103',1,code),undefined);
    assert.equal(reviewedStudyYear('school-2103',code),undefined);
    assert.equal(reviewedLessonPrice('school-37',code),undefined);
  }
  for(const code of [undefined,null,'К9999-26']){
    assert.equal(reviewedTeacher('school-37',1,code),undefined);
    assert.equal(reviewedStudyYear('school-37',code),undefined);
  }
  const registry=annualMosRefreshSchema.parse(read('content/annual-mos-refresh.generated.json'));
  assert.equal(registry.expectedGroups,74);assert.equal(registry.ok,false);
  for(let i=0;i<9;i++)assert.equal(registry.groups[`К${2763+i}-26`].teacher,'Серегина Мария Владимировна');
});
test('37: school scope resolves exact campus/map point; absent photo is not fabricated; no private invites',()=>{
  const scope=resolveSchoolScope(venues,'school-37');assert.ok(scope);
  const campus=venues.find(v=>v.slug==='school-37-michurinsky-28');assert.ok(campus);
  assert.equal(campus.schoolScopeSlug,'school-37');assert.equal(campus.address,'Мичуринский проспект, 28');
  assert.deepEqual([campus.latitude,campus.longitude],[55.702891,37.502471]);
  assert.equal(campus.photos.length,1);assert.equal(campus.logoUrl,'/sites/school-37/venue-avatar-original.jpg');
  assert.equal(campus.photos[0].url,'/sites/school-37/michurinsky-28-original.jpg');
  assert.equal(getSchoolProfile('school-37').campuses[campus.slug].metro,'Раменки');
  for(const p of ['content/annual-additions/school-37.json','content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json','data/v2/map-snapshot.json']){
    assert.doesNotMatch(fs.readFileSync(p,'utf8'),/max\.ru\/join\/|ФИО ученика|ФИО заявителя|Дата рождения ученика|Номер заявления|977.?149.?25.?11|977.?967.?88.?00/);
  }
});
