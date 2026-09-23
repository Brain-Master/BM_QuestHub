import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {questSchema,venueOfferSchema} from '../schemas';
import {annualBookingNeedsReview} from './annual-schedule';
import {getScheduleCapacity} from './schedule-board';
import {mosAvailabilityBinding,mosAvailabilitySchema,mergeMosAvailability,reconcileMosAvailability} from './mos-availability';
import {createMosAvailabilityFetcher,mosAvailabilityUrl} from './mos-availability-client';

const snapshot=JSON.parse(fs.readFileSync(new URL('../../data/offers-snapshot.json',import.meta.url),'utf8'));
const offer=venueOfferSchema.parse(snapshot.offersByQuest.shmi.find((o:{id:string})=>o.id==='year:К7648-26'));
const catalog=JSON.parse(fs.readFileSync(new URL('../../data/v2/catalog-snapshot.json',import.meta.url),'utf8'));
const quest=questSchema.parse({...catalog.courses.find((q:{slug:string})=>q.slug==='shmi'),offers:[offer]});
const now=new Date('2026-09-24T10:00:00.000Z');
const t1='2026-09-24T09:00:00.000Z',t2='2026-09-24T09:05:00.000Z';
const binding=mosAvailabilityBinding(offer)!;
const make=(checkedAt=t2,freeSeats=2)=>mosAvailabilitySchema.parse({version:1,attemptedAt:checkedAt,completedAt:checkedAt,
  expected:1,verified:1,archived:0,errors:[],entries:{[offer.id]:{binding,availability:{checkedAt,totalSeats:15,freeSeats,admission:'open'}}}});

test('capacity overlay is immutable, preserves editorial facts and full-card freshness',()=>{
 const before=JSON.stringify(quest);const updated=mergeMosAvailability([quest],make(),now)[0].offers[0];
 assert.equal(updated.annual?.freeSeats,2);assert.equal(updated.enrolled,13);
 for(const key of ['teacher','ageMin','ageMax','lessonPrice','coursePrice','studyYear','refreshedAt','sourceSha256'] as const)assert.equal(updated.annual?.[key],offer.annual?.[key]);
 assert.equal(updated.mosBookingUrl,offer.mosBookingUrl);assert.deepEqual(updated.weeklySlots,offer.weeklySlots);
 assert.equal(JSON.stringify(quest),before);
});
test('every binding mismatch and expired lifecycle discards overlay',()=>{
 for(const key of Object.keys(binding) as (keyof typeof binding)[]){const s=make();s.entries[offer.id].binding[key]+='different';assert.equal(mergeMosAvailability([quest],s,now)[0].offers[0],quest.offers[0]);}
 const past=mergeMosAvailability([quest],make(),new Date('2030-01-01'));assert.equal(past[0].offers[0],quest.offers[0]);
});
test('new full-card refresh and newer in-memory seat values outrank old sidecar',()=>{
 const updated=mergeMosAvailability([quest],make(t2),now);
 assert.equal(mergeMosAvailability(updated,make(t1,9),now)[0].offers[0].annual?.freeSeats,2);
 const q={...quest,offers:[{...offer,annual:{...offer.annual!,refreshedAt:'2026-09-24T09:10:00.000Z'}}]};
 assert.equal(mergeMosAvailability([q],make(),now)[0].offers[0].annual?.freeSeats,offer.annual?.freeSeats);
 assert.throws(()=>reconcileMosAvailability(make(t2),make(t1,9),now),/STALE/);
});
test('error-only response retains successful reading and separates unsafe identity from timeout',()=>{
 const failed=make();failed.verified=0;failed.completedAt='2026-09-24T09:06:00.000Z';
 failed.errors=[{offerId:offer.id,code:'MOS_TIMEOUT'}];failed.entries[offer.id]={binding,error:'MOS_TIMEOUT'};
 const retained=reconcileMosAvailability(make(),failed,now);assert.equal(retained.entries[offer.id].availability?.checkedAt,t2);
 const merged=mergeMosAvailability([quest],retained,now)[0].offers[0];assert.equal(merged.annual?.freeSeats,2);assert.equal(annualBookingNeedsReview(merged.annual),false);
 assert.equal(annualBookingNeedsReview({...merged.annual,availabilityError:'MOS_IDENTITY_CHANGED'}),true);
});
test('unknown is not zero; annual capacity overrides stale variants; full/empty/closed remain distinct',()=>{
 assert.equal(getScheduleCapacity({maxCapacity:15}),null);
 assert.equal(getScheduleCapacity({...offer,annual:{...offer.annual!,freeSeats:null}}),null);
 for(const [free,booked] of [[0,15],[2,13],[15,0]]){
  const o={...offer,annual:{...offer.annual!,totalSeats:15,freeSeats:free,admission:'closed' as const}};
  const capacity=getScheduleCapacity(o);assert.equal(capacity?.booked,booked);assert.equal(capacity?.left,free);assert.equal(capacity?.isSoldOut,free===0);
 }
 assert.equal(getScheduleCapacity({...offer,annual:{...offer.annual!,totalSeats:0,freeSeats:0}}),null);
 assert.equal(getScheduleCapacity({...offer,annual:{...offer.annual!,totalSeats:15,freeSeats:16}}),null);
});
test('schema rejects inconsistent capacity, forged coverage, future time and unsafe URL',()=>{
 const s=make();s.entries[offer.id].availability!.freeSeats=16;assert.equal(mosAvailabilitySchema.safeParse(s).success,false);
 const count=make();count.verified=0;assert.equal(mosAvailabilitySchema.safeParse(count).success,false);
 assert.throws(()=>reconcileMosAvailability(undefined,make('2030-01-01T00:00:00.000Z'),now),/STALE/);
 assert.equal(mosAvailabilityBinding({...offer,mosBookingUrl:'https://evil.example/1'}),null);
});
test('URL follows chosen source and ignores unrelated custom paths',()=>{
 assert.equal(mosAvailabilityUrl('/data/offers-snapshot.json'),'/ops/public/mos-availability.json');
 assert.equal(mosAvailabilityUrl('https://storage.yandexcloud.net/bm-questhub/data/offers-snapshot.json'), 'https://storage.yandexcloud.net/bm-questhub/ops/public/mos-availability.json');
 assert.equal(mosAvailabilityUrl('/other.json'),null);assert.equal(mosAvailabilityUrl(null),null);
});
test('fetcher keeps last success through failure, rejects delayed payload and recovers',async()=>{
 const current=new Date();const newer=current.toISOString(),older=new Date(+current-60000).toISOString();
 let response=make(older);let status=200;
 const fetcher=createMosAvailabilityFetcher(async()=>new Response(JSON.stringify(response),{status,headers:{'content-type':'application/json'}}));
 await fetcher('/test');status=503;await assert.rejects(fetcher('/test'));status=200;response=make(newer,1);await fetcher('/test');
 response=make(older,9);await assert.rejects(fetcher('/test'),/STALE/);
});
