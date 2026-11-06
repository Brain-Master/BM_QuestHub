import { z } from 'zod';
import { localCapacitySchema,probeLeadRoute } from '../lead-route';
import { resolveLeadEndpoint } from '../lead-endpoint';
import type { Quest } from '../schemas';
export const LOCAL_CAPACITY_URL=resolveLeadEndpoint('')+'?local-capacity=1';
const schema=localCapacitySchema;
export async function fetchLocalCapacity(url:string){return (await probeLeadRoute(url.replace(/\?local-capacity=1$/, ''))).data;}
export function mergeLocalCapacity(quests:Quest[],data?:z.infer<typeof schema>):Quest[]{return quests.map(q=>({...q,offers:q.offers.map(o=>{
 if(!o.localAnnual)return o;const group=data?.groups.find(g=>g.id===o.id);
 return {...o,localAnnual:{...o.localAnnual,availability:group?{total:group.total,free:group.free,open:group.open}:undefined}};
})}));}
