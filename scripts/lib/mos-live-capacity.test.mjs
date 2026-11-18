import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
process.env.TSX_TSCONFIG_PATH=new URL('../../apps/web/tsconfig.json',import.meta.url).pathname;
const {require:tsRequire}=await import('tsx/cjs/api');
const {refreshMosAvailability:refreshRaw}=tsRequire('./mos-live-capacity.ts',import.meta.url);
const refreshMosAvailability=(input,identities,previous,options)=>refreshRaw(input,identities,previous,{minIntervalMs:0,...options});
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
test('preliminary camps are skipped; official nonannual camps report unsupported without changing annual reads',async()=>{
 const before=JSON.stringify(snapshot);let calls=0;
 const result=await refreshMosAvailability(snapshot,registry.groups,undefined,{now:()=>new Date('2026-10-06T10:00:00Z'),fetchCard:async()=>{calls++;throw Error('MOS_TEST_UNAVAILABLE');}});
 assert.equal(result.expected,84);assert.equal(calls,76);assert.deepEqual(result.errors.filter(e=>e.code==='MOS_LEGACY_SOURCE_UNSUPPORTED').map(e=>e.offerId).sort(),['autumn-2026-17-hydraulics','autumn-2026-2044-dmitrovskoe-165e-k6','autumn-2026-2044-dmitrovskoe-169b','autumn-2026-2103','autumn-2026-937','autumn-2026-ekt','autumn-2026-ekt-chertanovskaya','autumn-2026-ekt-odesskaya']);assert.ok(result.errors.filter(e=>e.code!=='MOS_LEGACY_SOURCE_UNSUPPORTED').every(e=>e.offerId.startsWith('year:')));assert.equal(JSON.stringify(snapshot),before);
});

function fixture(count=6){
 const offers=Array.from({length:count},(_,i)=>({...structuredClone(offer),id:`year:TEST-${i}`,annual:{...offer.annual,groupCode:`TEST-${i}`}}));
 const identities=Object.fromEntries(offers.map(o=>[o.id.slice(5),{...card,groupCode:o.annual.groupCode}]));
 return {source:{...one,offersByQuest:{shmi:offers}},identities};
}
test('workers keep moving; retries occur only after all first attempts; bounded parallelism',async()=>{
 const {source,identities}=fixture();const calls=[];let active=0,max=0,release;const slow=new Promise(r=>release=r);
 const run=refreshMosAvailability(source,identities,undefined,{now,concurrency:2,fetchCard:async(id,e)=>{
  const n=calls.filter(c=>c===e.groupCode).length;calls.push(e.groupCode);max=Math.max(max,++active);
  try{if(calls.length===1)await slow;else if(calls.length===6)release();if(!n)throw Error('MOS_HTTP_503');return identities[e.groupCode];}finally{active--;}
 }});
 const r=await run;assert.equal(r.verified,6);assert.equal(calls.length,12);assert.equal(new Set(calls.slice(0,6)).size,6);assert.equal(max,2);
});
test('budget timeout capped; skipped groups lead next cycle; no retries after exhaustion',async()=>{
 const {source,identities}=fixture();let at=now().getTime();const calls=[];
 const options={concurrency:1,budgetMs:10,now:()=>new Date(at),fetchCard:async(id,e,o)=>{calls.push(e.groupCode);assert.ok(o.timeoutMs<=10);at+=o.timeoutMs;throw Error('MOS_TIMEOUT');}};
 const first=await refreshMosAvailability(source,identities,undefined,options);assert.equal(first.verified,0);assert.equal(calls.length,1);
 const skipped=Object.entries(first.entries).filter(([,r])=>r.error==='MOS_RUN_BUDGET').map(([id])=>id.slice(5));assert.equal(skipped.length,5);
 at+=300000;const second=await refreshMosAvailability(source,identities,first,options);assert.equal(calls.length,2);assert.ok(skipped.includes(calls[1]));assert.equal(second.verified,0);
});
test('429 and semantic failures are not retried; transient failure gets at most two attempts',async()=>{
 for(const code of ['MOS_HTTP_429','MOS_INVALID_RESPONSE','MOS_LOCATION_REVIEW_REQUIRED','MOS_HTTP_500','MOS_TIMEOUT']){
  let calls=0;const r=await refreshMosAvailability(one,registry.groups,undefined,{now,fetchCard:async()=>{calls++;throw Error(code);}});
  assert.equal(calls,['MOS_HTTP_500','MOS_TIMEOUT'].includes(code)?2:1);assert.equal(r.verified,0);assert.equal(r.errors.length,1);assert.equal(r.entries[offer.id].error,code);
 }
});
test('local annual capacity excluded; no MOS reads or false expected errors',async()=>{
 const local=Object.values(snapshot.offersByQuest).flat().filter(o=>o.localAnnual);assert.equal(local.length,3);
 const r=await refreshMosAvailability({...one,offersByQuest:{shmi:local}},registry.groups,undefined,{now,fetchCard:async()=>{throw Error('unexpected');}});
 assert.equal(r.expected,0);assert.equal(r.errors.length,0);assert.deepEqual(r.entries,{});
});
test('budget bounds rejected',async()=>{for(const budgetMs of [0,-1,NaN,Infinity,230001])await assert.rejects(refreshMosAvailability(one,registry.groups,undefined,{budgetMs}),/BUDGET/);});

test('only independently reviewed exact title changes accepted; locations and slots still checked',async()=>{
 for(const [key,title] of [['listing:2415012','3ПУ, Школа молодого IT-инженера (1 год обучения, 1 группа), ул. Маршала Тухачевского, д.58, корп.2, Хмельков Д.А.'],['К2765-26','ШМИ начинающие (СР 16:15-17:00) 2026-2027']]){
  const item=Object.values(snapshot.offersByQuest).flat().find(o=>o.id==='year:'+key);assert.ok(item);
  const source={...one,offersByQuest:{shmi:[item]}};const old=registry.groups[key];
  for(const [patch,ok] of [[{title},true],[{title:title+' changed'},false],[{title,address:'other'},false],[{title,slots:[{weekday:'Среда',start:'10:00',end:'11:00'}]},false],[{title,listingId:'123'},false]]){
   let calls=0;const r=await refreshMosAvailability(source,registry.groups,undefined,{now,fetchCard:async()=>{calls++;return {...old,...patch};}});assert.equal(r.verified,ok?1:0);assert.equal(calls,1);
  }
 }
});

test('global pacing spaces first and retry starts, with no catch-up burst after sleep delay',async()=>{
 const {source,identities}=fixture(6);let at=now().getTime();const starts=[];const calls=[];let sleeps=0;
 const r=await refreshMosAvailability(source,identities,undefined,{minIntervalMs:1000,now:()=>new Date(at),sleep:async ms=>{at+=ms+(sleeps++===0?5000:0);},fetchCard:async(id,e)=>{starts.push(at);const prior=calls.includes(e.groupCode);calls.push(e.groupCode);if(!prior)throw Error('MOS_HTTP_503');return identities[e.groupCode];}});
 assert.equal(r.verified,6);assert.equal(starts.length,12);for(let i=1;i<starts.length;i++)assert.ok(starts[i]-starts[i-1]>=1000);assert.equal(new Set(calls.slice(0,6)).size,6);
});
test('pacing never reserves or starts beyond the budget',async()=>{
 const {source,identities}=fixture(6);let at=now().getTime();const starts=[];
 const r=await refreshMosAvailability(source,identities,undefined,{budgetMs:2500,minIntervalMs:1000,now:()=>new Date(at),sleep:async ms=>{at+=ms;},fetchCard:async(id,e)=>{starts.push(at);return identities[e.groupCode];}});
 assert.equal(starts.length,3);assert.equal(r.verified,3);assert.equal(r.errors.length,3);assert.ok(r.errors.every(e=>e.code==='MOS_RUN_BUDGET'));
});
test('course ending during pacing wait is not fetched',async()=>{
 const {source,identities}=fixture(2);for(const o of source.offersByQuest.shmi)o.endDate='2026-09-24';for(const c of Object.values(identities))c.courseEnd='2026-09-24';
 let at=Date.parse('2026-09-24T20:59:59.500Z');let calls=0;
 const r=await refreshMosAvailability(source,identities,undefined,{minIntervalMs:1000,now:()=>new Date(at),sleep:async ms=>{at+=ms;},fetchCard:async(id,e)=>{calls++;return identities[e.groupCode];}});
 assert.equal(calls,1);assert.equal(r.errors[0].code,'MOS_COURSE_ENDED');
});
