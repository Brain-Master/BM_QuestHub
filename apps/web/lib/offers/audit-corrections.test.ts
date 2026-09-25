import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { canonicalAnnualOfferId, supersededAnnualGroups, isRetiredAnnualGroup } from '../../content/annual-retirements.mjs';
import { parseOffersSnapshot } from './snapshot-parse';
import { readFinderState, finderQuery } from './course-finder';
import { annualAvailabilityStale } from './annual-freshness';
import { getScheduleBookingMode, getScheduleDisplayStatus } from './schedule-board';
import { metroTextColor, METRO_LINES_BY_STATION } from '../../components/metro-label';
const offers = parseOffersSnapshot(JSON.parse(fs.readFileSync('data/offers-snapshot.json','utf8'))).offersByQuest.shmi;
const now = new Date('2026-09-24T10:01:00Z');

test('all eight reviewed replacements are exact; history and unrelated identities survive', () => {
  assert.equal(Object.keys(supersededAnnualGroups).length,8);
  for (const [oldCode,newCode] of Object.entries(supersededAnnualGroups)) {
    const old=offers.find(o=>o.id===`year:${oldCode}`), replacement=offers.find(o=>o.id===`year:${newCode}`);
    assert.ok(old); assert.ok(replacement);
    assert.equal(old.annual?.listingId,'2548560');
    assert.equal(old.venueSlug,'school-2044-dmitrovskoe-165e-k8');
    assert.equal(old.venueSlug,replacement.venueSlug);
    assert.deepEqual(old.weeklySlots,replacement.weeklySlots);
    assert.deepEqual([old.startDate,old.endDate],[replacement.startDate,replacement.endDate]);
    assert.equal(isRetiredAnnualGroup(old),true);assert.equal(old.scheduleCard?.isArchived,true);
    assert.equal(isRetiredAnnualGroup(replacement),false);
    const state=readFinderState(new URLSearchParams(`offer=${encodeURIComponent(old.id)}`),'school-2044');
    assert.equal(state.offer,replacement.id);
    assert.equal(new URLSearchParams(finderQuery(state,'school-2044')).get('offer'),replacement.id);
    assert.equal(isRetiredAnnualGroup({...old,annual:{...old.annual,listingId:'999'}}),false);
  }
  for (const code of ['К4045-26','К4069-26','К4070-26','К1981-26']) {
    const offer=offers.find(o=>o.id===`year:${code}`);assert.ok(offer);assert.equal(isRetiredAnnualGroup(offer),false);
  }
  for(const id of ['year:constructor','year:toString','year:unknown','unrelated'])assert.equal(canonicalAnnualOfferId(id),id);
  const current=offers.filter(o=>!isRetiredAnnualGroup(o));assert.equal(current.length,62);
  assert.equal(current.filter(o=>o.venueSlug.startsWith('school-2044-')).length,11);
});

test('only a recent successful check establishes admission; unknown is not closed or cancelled',()=>{
  const base=offers.find(o=>o.id==='year:К4045-26');assert.ok(base);assert.ok(base.annual);
  const fresh={...base,annual:{...base.annual,admission:'closed' as const,refreshedAt:'2026-09-24T10:00:00.000Z',refreshError:undefined}};
  assert.equal(annualAvailabilityStale(fresh.annual,now.getTime()),false);
  assert.equal(getScheduleDisplayStatus(fresh,now),'Приём закрыт');
  assert.equal(getScheduleBookingMode(fresh,'Приём закрыт',undefined,now).kind,'disabled');
  for(const metadata of [{...fresh.annual,refreshedAt:undefined},{...fresh.annual,refreshedAt:'2026-09-09T10:00:00Z'}, {...fresh.annual,refreshedAt:'2030-01-01T00:00:00Z'}, {...fresh.annual,availabilityError:'MOS_TIMEOUT'}]) {
    const stale={...fresh,annual:metadata};assert.equal(annualAvailabilityStale(metadata,now.getTime()),true);
    assert.equal(getScheduleDisplayStatus(stale,now),'Приём уточняется');
    assert.equal(getScheduleBookingMode(stale,'Приём уточняется',undefined,now).kind,'mos');
  }
  assert.equal(getScheduleBookingMode({...fresh,annual:{...fresh.annual,refreshError:'MOS_IDENTITY_CHANGED'}},'Приём уточняется',undefined,now).kind,'disabled');
  assert.equal(getScheduleBookingMode({...base,scheduleCard:{...base.scheduleCard!,isArchived:true}},'Завершено',undefined,now).kind,'disabled');
  const cancelled={...base,scheduleCard:{...base.scheduleCard!,status:'Отменено'}};
  assert.equal(getScheduleDisplayStatus(cancelled,now),'Отменено');
  assert.equal(getScheduleBookingMode(cancelled,'Отменено',undefined,now).kind,'disabled');
  assert.equal(getScheduleDisplayStatus({...fresh,scheduleCard:{...base.scheduleCard!,isArchived:true}},now),'Завершено');
});

test('official metro colours always choose text with at least AA contrast',()=>{
  const lum=(hex:string)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
  for(const line of Object.values(METRO_LINES_BY_STATION)) {
    const a=lum(line.color),b=lum(metroTextColor(line.color));
    assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,line.color);
  }
});
