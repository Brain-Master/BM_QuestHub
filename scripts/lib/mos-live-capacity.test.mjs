import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
process.env.TSX_TSCONFIG_PATH=new URL('../../apps/web/tsconfig.json',import.meta.url).pathname;
const {require:tsRequire}=await import('tsx/cjs/api');
const {refreshMosAvailability}=tsRequire('./mos-live-capacity.ts',import.meta.url);
const {handler}=tsRequire('./mos-live-capacity-handler.ts',import.meta.url);
const snapshot=JSON.parse(fs.readFileSync(new URL('../../apps/web/data/offers-snapshot.json',import.meta.url),'utf8'));
const registry=JSON.parse(fs.readFileSync(new URL('../../apps/web/content/annual-mos-refresh.generated.json',import.meta.url),'utf8'));
const offer=snapshot.offersByQuest.shmi.find(o=>o.id==='year:К7648-26');
const one={...snapshot,offersByQuest:{shmi:[offer]}};
const card=registry.groups[offer.id.slice(5)];
const now=()=>new Date('2026-09-24T10:00:00.000Z');
const refresh=(source=one,patch={},previous)=>refreshMosAvailability(source,registry.groups,previous,{now,fetchCard:async()=>({...card,...patch})});

test('updates only sidecar seats/admission, source bytes preserved',async()=>{
 const before=JSON.stringify(one);const r=await refresh(one,{freeSeats:0,status:'closed'});
 assert.equal(r.verified,1);assert.equal(r.entries[offer.id].availability.freeSeats,0);assert.equal(JSON.stringify(one),before);
});
test('archives explicit and ended skip network; closed current is fetched',async()=>{
 const source={...one,offersByQuest:{shmi:[{...offer,endDate:'2026-09-23'}, {...offer,id:'archived',scheduleCard:{...offer.scheduleCard,isArchived:true}}]}};
 const r=await refreshMosAvailability(source,registry.groups,undefined,{now,fetchCard:()=>{throw Error('unexpected');}});assert.equal(r.archived,2);assert.equal(r.expected,0);
 assert.equal((await refresh({...one,offersByQuest:{shmi:[{...offer,annual:{...offer.annual,admission:'closed'}}]}})).verified,1);
});
test('direct-link, identity, location, dates/title/slots and unknown counts fail without fabricated values',async()=>{
 for(const patch of [{cardId:'9999'},{address:'Another'},{organization:'Other'}, {title:'Changed course'}, {courseEnd:'2027-06-01'}, {slots:[{weekday:'Среда',start:'09:00',end:'10:00'}]}, {totalSeats:null},{freeSeats:null},{freeSeats:999}]){
  const r=await refresh(one,patch);assert.equal(r.verified,0);assert.equal(r.errors.length,1);assert.equal(r.entries[offer.id].availability,undefined);
 }
 const source={...one,offersByQuest:{shmi:[{...offer,mosBookingUrl:`https://www.mos.ru/pgu2/activity/groups?keyword=${card.listingId}`,annual:{...offer.annual,linkKind:'search'}}]}};
 const r=await refresh(source);assert.equal(r.errors[0].code,'MOS_DIRECT_CARD_REQUIRED');
});
test('partial failure preserves last-good checkedAt; all-failed is not success',async()=>{
 const previous=await refresh();let at='2026-09-24T10:05:00.000Z';
 const r=await refreshMosAvailability(one,registry.groups,previous,{now:()=>new Date(at),fetchCard:async()=>{throw Error('MOS_HTTP_500')}});
 assert.equal(r.verified,0);assert.equal(r.entries[offer.id].availability.checkedAt,previous.entries[offer.id].availability.checkedAt);assert.equal(r.entries[offer.id].error,'MOS_HTTP_500');
 at='2026-09-24T09:00:00.000Z';await assert.rejects(refreshMosAvailability(one,registry.groups,previous,{now:()=>new Date(at),fetchCard:async()=>card}));
});
test('duplicates/bad concurrency rejected, nonannual current reported unsupported, no arbitrary network',async()=>{
 await assert.rejects(refresh({...one,offersByQuest:{shmi:[offer,offer]}}),/SNAPSHOT/);
 await assert.rejects(refreshMosAvailability(one,registry.groups,undefined,{concurrency:NaN}),/CONCURRENCY/);
 const legacy={...offer};delete legacy.annual;
 const r=await refresh({...one,offersByQuest:{shmi:[legacy]}});assert.equal(r.errors[0].code,'MOS_LEGACY_SOURCE_UNSUPPORTED');
});
test('HTTP entrypoint rejects spoofed timer regardless of enabled env',async()=>{
 const response=await handler({httpMethod:'POST',messages:[{event_metadata:{event_type:'yandex.cloud.events.serverless.triggers.TimerMessage'}}]});
 assert.equal(response.statusCode,403);
});
