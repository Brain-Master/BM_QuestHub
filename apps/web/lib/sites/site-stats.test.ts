import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {questSchema, venueSchema, worldSchema} from '../schemas';
import {getSchoolScopes} from '../offers/agenda';
import {getScheduleBookingMode, getScheduleDisplayStatus} from '../offers/schedule-board';
import {buildSiteScopeCards} from './scope-card';
import {getSiteMapColor, INACTIVE_MAP_MARKER_COLOR} from './map-colors';

test('scheduled count includes closed/sold-out groups; admission and capacity do not grey out an active venue', () => {
  const read=(file:string)=>JSON.parse(fs.readFileSync(file,'utf8'));
  const catalog=read('data/v2/catalog-snapshot.json');
  const venues=venueSchema.array().parse(read('data/v2/map-snapshot.json').venues);
  const rows=read('data/offers-snapshot.json').offersByQuest.shmi;
  const quests=questSchema.array().parse(catalog.courses.filter((q:{slug:string})=>q.slug==='shmi').map((q:object)=>({...q,offers:rows})));
  const shmi=quests[0];
  shmi.offers=shmi.offers.filter(o=>o.venueSlug==='school-1517-narodnoe-opolchenie');
  assert.equal(shmi.offers.length,5);
  for(const offer of shmi.offers){offer.endDate='2099-05-31';offer.annual!.admission='closed';offer.annual!.freeSeats=2;offer.enrolled=13;offer.maxCapacity=15;}
  const params={scopes:getSchoolScopes(venues),venues,quests,worlds:worldSchema.array().parse(catalog.worlds),includeInactive:true};
  let card=buildSiteScopeCards(params).find(s=>s.slug==='school-1517')!;
  assert.equal(card.shiftCount,5);assert.equal(card.campuses[0].shiftCount,5);
  assert.notEqual(getSiteMapColor(card),INACTIVE_MAP_MARKER_COLOR);
  for(const offer of shmi.offers){
    assert.equal(getScheduleDisplayStatus(offer,new Date('2026-09-23T12:00:00Z')),'Приём закрыт');
    assert.deepEqual(getScheduleBookingMode(offer,'Приём закрыт'),{kind:'disabled',label:'Приём закрыт'});
    offer.annual!.admission='open';offer.annual!.freeSeats=0;offer.enrolled=15;
    assert.equal(getScheduleDisplayStatus(offer,new Date('2026-09-23T12:00:00Z')),'Мест нет');
    assert.equal(getScheduleBookingMode(offer,'Мест нет').kind,'disabled');
  }
  card=buildSiteScopeCards(params).find(s=>s.slug==='school-1517')!;
  assert.equal(card.shiftCount,5);assert.notEqual(getSiteMapColor(card),INACTIVE_MAP_MARKER_COLOR);
  shmi.offers=[];
  card=buildSiteScopeCards(params).find(s=>s.slug==='school-1517')!;
  assert.equal(card.shiftCount,0);assert.equal(getSiteMapColor(card),INACTIVE_MAP_MARKER_COLOR);
});
