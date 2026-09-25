import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {isRetiredAnnualGroup} from '../../content/annual-retirements.mjs';
import {questSchema,venueSchema,worldSchema,venueOfferSchema} from '../schemas';
import {buildAgendaItems} from './agenda';
import {buildScheduleBoardItem,getScheduleBookingMode,getScheduleDisplayStatus,resolveScheduleStatusKey} from './schedule-board';
import {finderChoices,finderItemMatches,readFinderState} from './course-finder';
import {projectAnnualWorkspace} from '../year-schedule';
import {mergeMosAvailability,mosAvailabilityBinding,type MosAvailability} from './mos-availability';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read('data/offers-snapshot.json');
const catalogue=read('data/v2/catalog-snapshot.json');
const quests=questSchema.array().parse(catalogue.courses.map((q:{slug:string})=>({...q,offers:snapshot.offersByQuest[q.slug]??[]})));
const venues=venueSchema.array().parse(read('data/v2/map-snapshot.json').venues);
const now=new Date('2026-09-24T10:00:00Z');
test('five historical removals and eight replacements cannot pollute ordinary facets',()=>{
 const annual=quests.flatMap(q=>q.offers).filter(o=>o.annual);
 const removed=annual.filter(isRetiredAnnualGroup);assert.equal(annual.length,74);assert.equal(removed.length,13);
 assert.deepEqual([...new Set(removed.map(o=>o.annual!.listingId))].sort(),['2463216','2548560','2548561','2549843','2549844','2549845']);
 for(const o of removed)assert.equal(o.scheduleCard?.isArchived,true);
 const old=quests.map(q=>({...q,offers:q.offers.map(o=>isRetiredAnnualGroup(o)?venueOfferSchema.parse({...o,id:`old:${o.id}`,scheduleCard:{...o.scheduleCard,isArchived:false}}):o)}));
 const items=buildAgendaItems({quests:old,venues,worlds:worldSchema.array().parse(catalogue.worlds)}).map(i=>buildScheduleBoardItem(i,undefined,now));
 const state=readFinderState(new URLSearchParams('school=school-2044&venue=school-2044-dmitrovskoe-169b'));
 assert.deepEqual(finderChoices(items,state,'day',['1','2','3','4','5','6','7']),['3']);
 for(const item of items.filter(i=>isRetiredAnnualGroup(i.offer))){
  assert.equal(finderItemMatches(item,readFinderState(new URLSearchParams())),false);
  assert.equal(finderItemMatches(item,{...state,venue:item.venue.slug,offer:item.offer.id}),true);
  assert.equal(resolveScheduleStatusKey(item.offer,now),'cancelled');
  assert.ok(item.variants.every(v=>v.bookingMode.kind==='disabled'));
  const conflict={...item.offer,annual:{...item.offer.annual!,admission:'closed' as const,refreshError:'MOS_GROUP_NOT_FOUND'}};
  assert.equal(getScheduleDisplayStatus(conflict,now),'Отменено');
  assert.equal(getScheduleBookingMode(conflict,'Идёт набор').kind,'disabled');
 }
 const view=projectAnnualWorkspace(old,venues);assert.equal(view.groups.length,61);assert.ok(view.groups.every(g=>!isRetiredAnnualGroup(g)));
 const school875=annual.find(o=>o.annual?.listingId==='2463216');assert.ok(school875);assert.equal(isRetiredAnnualGroup(school875),true);
 assert.ok(view.groups.every(g=>g.listingId!=='2463216'));
});
test('availability cannot resurrect/modify a retired old-hot record; unrelated closed/full remain active',()=>{
 const q=quests.find(q=>q.slug==='shmi')!;
 const retired=q.offers.find(isRetiredAnnualGroup)!;
 const old=venueOfferSchema.parse({...retired,scheduleCard:{...retired.scheduleCard,isArchived:false}});
 const binding=mosAvailabilityBinding(old);assert.ok(binding);
 const at=now.toISOString();const data:MosAvailability={version:1,attemptedAt:at,completedAt:at,expected:1,verified:1,archived:0,errors:[],entries:{[old.id]:{binding,availability:{checkedAt:at,totalSeats:12,freeSeats:12,admission:'open'}}}};
 assert.equal(mergeMosAvailability([{...q,offers:[old]}],data,now)[0].offers[0],old);
 const kept=q.offers.find(o=>o.id==='year:К4045-26')!;
 for(const freeSeats of [0,null]){
  const offer={...kept,annual:{...kept.annual!,admission:'closed' as const,freeSeats}};
  assert.equal(isRetiredAnnualGroup(offer),false);assert.ok(!['finished','cancelled'].includes(resolveScheduleStatusKey(offer,now)));
 }
});
