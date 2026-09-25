import {randomUUID} from 'node:crypto';

export const AVAILABILITY_KEY='ops/public/mos-availability.json';
export const LEASE_KEY='ops/mos-live-capacity-state.json';
export const OFFERS_KEY='data/offers-snapshot.json';
export const INTERVAL_MS=300_000;
const LEASE_MS=600_000;

/** Store port: read returns {data,etag} or null on confirmed404; put is a single CAS, never a blind retry. */
export async function runAvailabilityJob({store,refresh,now=()=>new Date(),runId=randomUUID(),dryRun=false}){
  const started=now();const source=await store.read(OFFERS_KEY);
  if(!source?.etag)throw Error('MOS_SOURCE_UNAVAILABLE');
  const previous=await store.read(AVAILABILITY_KEY);
  if(dryRun)return {published:false,result:await refresh(source.data,previous?.data)};
  const state=await store.read(LEASE_KEY);
  if(state && (!state.data || !Number.isFinite(Date.parse(state.data.leaseUntil))))throw Error('MOS_LEASE_INVALID');
  if(state && Date.parse(state.data.leaseUntil)>started.getTime())return {published:false,skipped:'lease_busy'};
  // A second invocation immediately after success must not double the MOS request rate.
  if(state?.data.nextDueAt && Date.parse(state.data.nextDueAt)>started.getTime())return {published:false,skipped:'not_due'};
  const lease={runId,startedAt:started.toISOString(),leaseUntil:new Date(started.getTime()+LEASE_MS).toISOString()};
  const acquired=await store.put(LEASE_KEY,lease,state?.etag??null);
  let report;
  try{
    const result=await refresh(source.data,previous?.data);
    if(now().getTime()>=Date.parse(lease.leaseUntil))throw Error('MOS_LEASE_EXPIRED');
    // If a venue/content release happened while fetching MOS, discard this run; next tick binds the new source.
    const latest=await store.read(OFFERS_KEY);
    if(latest?.etag!==source.etag)throw Error('MOS_SOURCE_CHANGED');
    const owner=await store.read(LEASE_KEY);
    if(owner?.etag!==acquired || owner?.data.runId!==runId)throw Error('MOS_LEASE_LOST');
    const written=await store.put(AVAILABILITY_KEY,result,previous?.etag??null);
    const readback=await store.read(AVAILABILITY_KEY);
    if(readback?.etag!==written || JSON.stringify(readback.data)!==JSON.stringify(result))throw Error('MOS_PUBLICATION_UNVERIFIED');
    report={published:true,expected:result.expected,verified:result.verified,errors:result.errors.length,
      completedAt:result.completedAt,complete:result.expected>0&&result.verified===result.expected};
    return report;
  }finally{
    // Do not mask the primary failure or release someone else's renewed lease.
    try {
    const owner=await store.read(LEASE_KEY);
    if(owner?.etag===acquired && owner?.data.runId===runId){
      const finished=now();
      await store.put(LEASE_KEY,{...lease,leaseUntil:finished.toISOString(),
        // Align to the next cron boundary: a slightly earlier next invocation must not turn 5min into 10min.
        nextDueAt:new Date((Math.floor(started.getTime()/INTERVAL_MS)+1)*INTERVAL_MS).toISOString(),
        lastAttemptAt:started.toISOString(),lastCompletedAt:report?.completedAt??null,
        ...(report?.complete?{lastSuccessAt:report.completedAt}:state?.data.lastSuccessAt?{lastSuccessAt:state.data.lastSuccessAt}:{}),
        published:report?.published??false,verified:report?.verified??0,errors:report?.errors??null,
      },acquired);
      if(report)report.leaseReleased=true;
    }else if(report){
      throw Error('MOS_LEASE_RELEASE_FAILED');
    }
    }catch{
      if(report){report.leaseReleased=false;report.cleanupError='MOS_LEASE_RELEASE_FAILED';}
      // A cleanup error must remain observable even when the primary refresh failed.
      console.warn(JSON.stringify({phase:'mos_lease_cleanup',error:'MOS_LEASE_RELEASE_FAILED'}));
    }
  }
}
