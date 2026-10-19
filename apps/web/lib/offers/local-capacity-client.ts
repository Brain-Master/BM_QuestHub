import { z } from 'zod';
import { resolveLeadEndpoint } from '../lead-endpoint';
import type { Quest } from '../schemas';
export const LOCAL_CAPACITY_URL=resolveLeadEndpoint('')+'?local-capacity=1';
const schema=z.object({groups:z.array(z.object({id:z.string(),total:z.number().int().positive(),free:z.number().int().nonnegative(),open:z.boolean()}).strict().refine(g=>g.free<=g.total))}).strict().refine(v=>new Set(v.groups.map(g=>g.id)).size===v.groups.length);
export async function fetchLocalCapacity(url:string){const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('LOCAL_CAPACITY_UNAVAILABLE');return schema.parse(await response.json());}
export function mergeLocalCapacity(quests:Quest[],data?:z.infer<typeof schema>):Quest[]{return quests.map(q=>({...q,offers:q.offers.map(o=>{
 if(!o.localAnnual)return o;const group=data?.groups.find(g=>g.id===o.id);
 return {...o,localAnnual:{...o.localAnnual,availability:group?{total:group.total,free:group.free,open:group.open}:undefined}};
})}));}
