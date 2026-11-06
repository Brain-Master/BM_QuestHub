import { z } from 'zod';
const primary='https://forms.b-master.pro/api/leads';
const secondary='https://space.b-master.pro/api/leads';
export const localCapacitySchema=z.object({groups:z.array(z.object({id:z.string(),total:z.number().int().positive(),free:z.number().int().nonnegative(),open:z.boolean()}).strict().refine(g=>g.free<=g.total))}).strict().refine(v=>new Set(v.groups.map(g=>g.id)).size===v.groups.length);
/** Select a reachable route using anonymous GET only, before any application POST.
 * Both fixed routes serve the same reservation database. Never replay a POST here. */
export async function probeLeadRoute(endpoint=primary,fetchImpl:typeof fetch=fetch){
 const candidates=endpoint===primary?[primary,secondary]:[endpoint];
 for(const candidate of candidates){
  try{const r=await fetchImpl(candidate+'?local-capacity=1',{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(4000)});if(!r.ok)continue;
   const data=localCapacitySchema.parse(await r.json());return {endpoint:candidate,data};
  }catch{/* A failed anonymous read is safe to try on the other fixed route. */}
 }
 throw Error('LEAD_ROUTE_UNAVAILABLE');
}
