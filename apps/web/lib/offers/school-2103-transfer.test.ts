import assert from 'node:assert/strict';import fs from 'node:fs';import {test} from 'node:test';
import {effectiveAnnualFreeSeats} from './annual-schedule';
import {getScheduleCapacity,getScheduleBookingMode} from './schedule-board';
import {mosAvailabilityBinding,mergeMosAvailability,type MosAvailability} from './mos-availability';
import {parseOffersSnapshot} from './snapshot-parse';
import {venueOfferToEventV2} from '../data/v2/v1-to-v2';
const snapshot=parseOffersSnapshot(JSON.parse(fs.readFileSync('data/offers-snapshot.json','utf8')));
const byCode=(code:string)=>snapshot.offersByQuest.shmi.find(o=>o.annual?.groupCode===code)!;
test('old held reserve conservatively adds to new occupancy, clamped to capacity without changing raw counters',()=>{
 const expected:Record<string,number>={'К3128-26':7,'К3119-26':1,'К3129-26':12,'К3120-26':9,'К3121-26':7,'К3122-26':7,'К3123-26':0,'К3124-26':0,'К3125-26':12,'К3126-26':6,'К3127-26':5};
 for(const [code,left]of Object.entries(expected)){const o=byCode(code);assert.equal(getScheduleCapacity(o)?.left,left);assert.equal(o.enrolled,o.annual!.totalSeats!-o.annual!.freeSeats!);}
 const o=byCode('К3123-26');assert.equal(o.enrolled,1);assert.equal(getScheduleCapacity(o)?.booked,12);assert.equal(venueOfferToEventV2('shmi',o).capacity?.booked,1);
});
test('missing counts stay unknown; full reserve blocks even unknown or stale portal, decreases in capacity never release it',()=>{
 assert.equal(effectiveAnnualFreeSeats({totalSeats:12,freeSeats:null,legacyReservation:{places:3}}),null);
 assert.equal(effectiveAnnualFreeSeats({totalSeats:null,freeSeats:12,legacyReservation:{places:12}}),null);
 assert.equal(effectiveAnnualFreeSeats({totalSeats:10,freeSeats:10,legacyReservation:{places:12}}),0);
 const o=structuredClone(byCode('К3123-26'));o.annual!.freeSeats=null;
 assert.equal(getScheduleCapacity(o)?.left,0);
 assert.equal(getScheduleBookingMode(o,'Идёт набор',undefined,new Date('2026-10-20')).kind,'disabled');
 const partial=structuredClone(byCode('К3124-26'));partial.annual!.availabilityError='MOS_HTTP_500';assert.equal(getScheduleBookingMode(partial,'Идёт набор',undefined,new Date('2026-10-20')).kind,'disabled');
});
test('fresh availability updates only portal counts and never releases/double-applies held reserve',()=>{
 const offer=byCode('К3124-26'),binding=mosAvailabilityBinding(offer)!;
 const data: MosAvailability={version:1,attemptedAt:'2026-10-06T10:00:00Z',completedAt:'2026-10-06T10:00:01Z',expected:1,verified:1,archived:0,errors:[],entries:{[offer.id]:{binding,availability:{checkedAt:'2026-10-06T10:00:01Z',totalSeats:12,freeSeats:11,admission:'open'}}}};
 const quests=[{offers:[offer]}] as Parameters<typeof mergeMosAvailability>[0];
 const once=mergeMosAvailability(quests,data,new Date('2026-10-06T10:01:00Z')),twice=mergeMosAvailability(once,data,new Date('2026-10-06T10:01:00Z'));
 assert.deepEqual(twice,once);assert.equal(twice[0].offers[0].enrolled,1);assert.equal(twice[0].offers[0].annual!.freeSeats,11);assert.equal(getScheduleCapacity(twice[0].offers[0])?.left,1);assert.deepEqual(twice[0].offers[0].annual!.legacyReservation,offer.annual!.legacyReservation);
 const failed={...data,verified:0,errors:[{offerId:offer.id,code:'MOS_HTTP_500'}],entries:{[offer.id]:{...data.entries[offer.id],error:'MOS_HTTP_500'}}};
 assert.equal(getScheduleCapacity(mergeMosAvailability(once,failed,new Date('2026-10-06T10:01:00Z'))[0].offers[0])?.left,1);
});
