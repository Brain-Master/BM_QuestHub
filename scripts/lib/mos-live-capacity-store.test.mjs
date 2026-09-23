import {test} from 'node:test';import assert from 'node:assert/strict';
import {runAvailabilityJob,AVAILABILITY_KEY,LEASE_KEY,OFFERS_KEY,INTERVAL_MS} from './mos-live-capacity-store.mjs';
const now=()=>new Date('2026-09-24T10:00:00.000Z');
const result={expected:2,verified:1,errors:[{offerId:'b',code:'MOS_TIMEOUT'}],completedAt:now().toISOString()};
function fixture(){let n=1;const rows=new Map([[OFFERS_KEY,{data:{offers:'baseline'},etag:'v1'}]]);const writes=[];
 const store={async read(key){return structuredClone(rows.get(key)??null);},async put(key,data,etag){
  assert.ok([AVAILABILITY_KEY,LEASE_KEY].includes(key));if((rows.get(key)?.etag??null)!==etag)throw Error('PRECONDITION_FAILED');
  const next=`v${++n}`;rows.set(key,{data:structuredClone(data),etag:next});writes.push(key);return next;}};
 return {rows,writes,store};}
test('dry-run never writes; partial result published truthfully; only availability+lease keys',async()=>{
 const f=fixture();await runAvailabilityJob({...f,now,refresh:async()=>result,dryRun:true});assert.deepEqual(f.writes,[]);
 const r=await runAvailabilityJob({...f,now,refresh:async()=>result});assert.equal(r.complete,false);assert.equal(r.verified,1);
 assert.equal(f.rows.get(LEASE_KEY).data.lastSuccessAt,undefined);assert.equal(f.rows.get(OFFERS_KEY).etag,'v1');assert.equal(INTERVAL_MS,300000);
 const second=await runAvailabilityJob({...f,now,refresh:async()=>{throw Error('should not poll early')}});assert.equal(second.skipped,'not_due');
});
test('active lease skips, expired lease can be claimed; concurrent CAS does not retry',async()=>{
 const f=fixture();f.rows.set(LEASE_KEY,{etag:'busy',data:{runId:'other',leaseUntil:'2026-09-24T10:01:00.000Z'}});
 assert.equal((await runAvailabilityJob({...f,now,refresh:async()=>result})).skipped,'lease_busy');
 f.rows.get(LEASE_KEY).data.leaseUntil='2026-09-24T09:59:00.000Z';
 const r=await runAvailabilityJob({...f,now,refresh:async()=>result});assert.equal(r.published,true);
});
test('cron jitter does not skip the next five-minute boundary',async()=>{
 const f=fixture();let at=new Date('2026-09-24T10:00:03.000Z');
 await runAvailabilityJob({...f,now:()=>at,refresh:async()=>result});
 assert.equal(f.rows.get(LEASE_KEY).data.nextDueAt,'2026-09-24T10:05:00.000Z');
 at=new Date('2026-09-24T10:05:01.000Z');
 assert.equal((await runAvailabilityJob({...f,now:()=>at,refresh:async()=>result})).published,true);
});
test('changed source or sidecar prevents publication; no blind replay',async()=>{
 for(const key of [OFFERS_KEY,AVAILABILITY_KEY]){
  const f=fixture();await assert.rejects(runAvailabilityJob({...f,now,refresh:async()=>{f.rows.set(key,{data:{concurrent:true},etag:'concurrent'});return result;}}),/SOURCE_CHANGED|PRECONDITION/);
  assert.equal(f.rows.get(key).etag,'concurrent');
 }
});
test('stolen/expired lease cannot publish/release owner; failed readback never success',async()=>{
 const f=fixture();await assert.rejects(runAvailabilityJob({...f,now,refresh:async()=>{f.rows.set(LEASE_KEY,{data:{runId:'other',leaseUntil:'2026-09-24T10:20:00.000Z'},etag:'other'});return result;}}),/LEASE_LOST/);
 assert.equal(f.rows.get(LEASE_KEY).etag,'other');assert.equal(f.rows.has(AVAILABILITY_KEY),false);
 const g=fixture();let t=now();await assert.rejects(runAvailabilityJob({...g,now:()=>t,refresh:async()=>{t=new Date(+t+610000);return result;}}),/LEASE_EXPIRED/);
 const h=fixture();const read=h.store.read;h.store.read=async key=>key===AVAILABILITY_KEY&&h.writes.includes(AVAILABILITY_KEY)?{data:{wrong:true},etag:'wrong'}:read(key);
 await assert.rejects(runAvailabilityJob({...h,now,refresh:async()=>result}),/UNVERIFIED/);assert.equal(h.rows.get(LEASE_KEY).data.published,false);
});
