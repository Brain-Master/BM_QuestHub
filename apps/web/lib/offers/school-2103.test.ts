import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {test} from 'node:test';
import {annualProgrammeName} from './annual-programme-name';
import {reviewedLessonPrice} from '../../content/annual-group-overrides';
import {parseOffersSnapshot} from './snapshot-parse';
import {questSchema,venueSchema} from '../schemas';
import {projectAnnualWorkspace} from '../year-schedule';
import {getScheduleBookingMode} from './schedule-board';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const addition=read('content/annual-additions/school-2103.json');
const snapshot=parseOffersSnapshot(read('data/offers-snapshot.json'));
const addedIds=new Set<string>(addition.groups.map((g:{groupCode:string})=>`year:${g.groupCode}`));
const added=snapshot.offersByQuest.shmi.filter(o=>addedIds.has(o.id));
const laterIds=new Set<string>(['year:К4609-26','year:К2215-26','year:К2216-26','year:К2217-26','year:К2218-26',...read('content/annual-additions/school-37.json').groups.map((g:{groupCode:string})=>`year:${g.groupCode}`)]);
test('all nine supplied identities get exact campus/year/slot/booking and owner price',()=>{
  assert.equal(added.length,9);assert.equal(new Set(added.map(o=>o.mosBookingUrl)).size,9);
  assert.deepEqual([1,2,3].map(y=>added.filter(o=>o.annual?.studyYear===y).length),[4,3,2]);
  assert.equal(added.filter(o=>o.venueSlug==='school-2103-yasenevo').length,2);
  assert.equal(added.filter(o=>o.venueSlug==='school-2103-golubinskaya-5k4').length,7);
  for(const o of added){
    const raw=addition.groups.find((g:{groupCode:string})=>g.groupCode===o.annual?.groupCode);
    assert.ok(raw);assert.equal(o.mosBookingUrl,raw.link);assert.deepEqual(o.weeklySlots,raw.slots);
    assert.equal(annualProgrammeName(raw.title).studyYear,o.annual?.studyYear);
    assert.equal(o.annual?.lessonPrice,1000);assert.equal(o.annual?.sourceLessonPrice,888);
    assert.equal(o.annual?.lessonPriceSource,'owner:2026-09-21');
    assert.equal(raw.lessonPrice,888);assert.equal(o.annual?.refreshedAt,raw.refreshedAt);
    assert.equal(o.priceLabel,'1 000 ₽ / занятие · 1 акад. час (45 мин)');
    assert.ok(o.scheduleCard?.variants?.every(v=>v.priceLabel===o.priceLabel));
    assert.equal(getScheduleBookingMode(o,'Идёт набор').kind,'mos');
  }
});
test('original 51 offers survive byte-equivalent JSON except explicit revision migration',()=>{
  const existing=snapshot.offersByQuest.shmi.filter(o=>!addedIds.has(o.id)&&!laterIds.has(o.id));assert.equal(existing.length,51);
  // Hash raw serialized records, not Zod-normalized output.
  const raw=read('../../scripts/fixtures/annual-69-before-1517/offers.json').offersByQuest.shmi.filter((o:{id:string})=>!addedIds.has(o.id)&&!laterIds.has(o.id));
  for(const o of raw)delete o.annual.sourceSha256;
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex'),'538c6f668471025fe9cd4a4bb29d84257c9926228af23012564084eb809dcd9c');
  assert.equal(snapshot.offersByQuest.shmi.filter(o=>o.annual?.refreshError==='MOS_GROUP_NOT_FOUND').length,8);
});
test('price override is identity scoped; annual table uses the same effective numeric price',()=>{
  assert.equal(reviewedLessonPrice('school-17','К3015-26'),undefined);
  assert.equal(reviewedLessonPrice('school-2103','К9999-26'),undefined);
  assert.equal(reviewedLessonPrice('school-2103',null),undefined);
  const venues=venueSchema.array().parse(read('data/v2/map-snapshot.json').venues);
  const quests=questSchema.array().parse(read('data/v2/catalog-snapshot.json').courses.map((q:{slug:string})=>({...q,offers:snapshot.offersByQuest[q.slug]??[]})));
  const view=projectAnnualWorkspace(quests,venues);
  for(const g of view.groups.filter(g=>addedIds.has(`year:${g.id}`)))assert.equal(g.lessonPrice,1000);
  assert.equal(view.groups.length,70);assert.equal(view.locations.length,12);
});
