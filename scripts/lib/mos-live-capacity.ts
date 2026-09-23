import type { VenueOffer } from "../../apps/web/lib/schemas";
import { isRetiredAnnualGroup } from "../../apps/web/content/annual-retirements.mjs";
import { venueOfferSchema } from "../../apps/web/lib/schemas";
import { z } from "../../apps/web/node_modules/zod/index.js";
import { mosAvailabilitySchema, mosAvailabilityBinding, sameMosBinding, type MosAvailability } from "../../apps/web/lib/offers/mos-availability";
import { annualMosCardSchema } from "../../apps/web/lib/offers/annual-schedule";
import { fetchMosCard, validateProjectedMosCard } from "./mos-annual-cards.mjs";
import { groupLifecycle, moscowDate } from "./mos-group-lifecycle.mjs";

const snapshotSchema=z.object({version:z.literal(1),generatedAt:z.string(),offersByQuest:z.record(z.string(),z.array(venueOfferSchema))});
type Card=z.infer<typeof annualMosCardSchema>;
export const publicOffersSchema=snapshotSchema;
export const safeMosError=(error:unknown)=> error instanceof Error && /^MOS_[A-Z0-9_]+$/.test(error.message)
  ? error.message : error instanceof Error && /timeout/i.test(error.name) ? "MOS_TIMEOUT" : "MOS_FETCH_FAILED";

/** Public reads only; no credentials, files, Sheets writes, or content compilation. */
export async function refreshMosAvailability(input:unknown, identities:Record<string,Card>, previous?:MosAvailability, options:{
  now?:()=>Date; fetchCard?:typeof fetchMosCard; concurrency?:number; budgetMs?:number;
}={}) {
  const snapshot=snapshotSchema.parse(input);
  const now=options.now??(()=>new Date()); const start=now();
  const concurrency=options.concurrency??2;
  if(!Number.isInteger(concurrency)||concurrency<1||concurrency>3)throw Error("MOS_CONCURRENCY_INVALID");
  const offers=Object.values(snapshot.offersByQuest).flat();
  if(offers.length>1000 || new Set(offers.map(o=>o.id)).size!==offers.length)throw Error("MOS_SNAPSHOT_INVALID");
  const result:MosAvailability={version:1,attemptedAt:start.toISOString(),completedAt:start.toISOString(),expected:0,verified:0,archived:0,errors:[],entries:{}};
  const current:VenueOffer[]=[];
  for(const offer of offers){
    if(isRetiredAnnualGroup(offer)){result.archived++;continue;}
    const lifecycle=groupLifecycle({...offer,...offer.scheduleCard},moscowDate(now()));
    if(lifecycle.state==='archived'){result.archived++;continue;}
    result.expected++;
    if(!offer.annual){result.errors.push({offerId:offer.id,code:"MOS_LEGACY_SOURCE_UNSUPPORTED"});continue;}
    if(lifecycle.state==='unknown'){result.errors.push({offerId:offer.id,code:lifecycle.reason});continue;}
    current.push(offer);
  }
  const fetchCard=options.fetchCard??fetchMosCard;
  for(let offset=0;offset<current.length;offset+=concurrency){
    await Promise.all(current.slice(offset,offset+concurrency).map(async offer=>{
      const binding=mosAvailabilityBinding(offer);
      if(!binding){result.errors.push({offerId:offer.id,code:"MOS_DIRECT_CARD_REQUIRED"});return;}
      const old=previous?.entries[offer.id];
      const retained=old&&sameMosBinding(old.binding,binding)?old.availability:undefined;
      try{
        if(isRetiredAnnualGroup(offer))throw Error("MOS_OWNER_RETIRED");
        if(now().getTime()-start.getTime()>(options.budgetMs??230_000))throw Error("MOS_RUN_BUDGET");
        if(groupLifecycle(offer,moscowDate(now())).state==='archived')throw Error("MOS_COURSE_ENDED");
        const expected=identities[offer.id.replace(/^year:/,"")];
        if(!expected || expected.cardId!==binding.cardId || expected.listingId!==binding.listingId || expected.groupCode!==binding.groupCode)throw Error("MOS_IDENTITY_REVIEW_REQUIRED");
        const fresh=await fetchCard(binding.cardId,{listingId:binding.listingId,groupCode:binding.groupCode},{timeoutMs:8000});
        validateProjectedMosCard(fresh);
        if(fresh.cardId!==binding.cardId||fresh.listingId!==binding.listingId||fresh.groupCode!==binding.groupCode)throw Error("MOS_IDENTITY_CHANGED");
        if(fresh.address!==expected.address||fresh.organization!==expected.organization)throw Error("MOS_LOCATION_REVIEW_REQUIRED");
        const slots=fresh.slots.map((s:{weekday:string;start:string;end:string})=>`${s.weekday}|${s.start}|${s.end}`).sort().join(';');
        if(fresh.courseStart!==binding.startDate||fresh.courseEnd!==binding.endDate||slots!==binding.slots||fresh.title!==expected.title)throw Error("MOS_SCHEDULE_REVIEW_REQUIRED");
        if(fresh.totalSeats===null||fresh.totalSeats<=0||fresh.freeSeats===null)throw Error("MOS_PARTIAL_FIELDS");
        const checkedAt=now().toISOString();
        if(checkedAt<start.toISOString() || (retained && checkedAt<=retained.checkedAt))throw Error("MOS_CLOCK_STALE");
        result.entries[offer.id]={binding,availability:{checkedAt,totalSeats:fresh.totalSeats,freeSeats:fresh.freeSeats,admission:fresh.status}};
        result.verified++;
      }catch(error){
        const code=safeMosError(error);result.errors.push({offerId:offer.id,code});
        result.entries[offer.id]={binding,...(retained?{availability:retained}:{}),error:code};
      }
    }));
  }
  result.completedAt=now().toISOString();
  result.errors.sort((a,b)=>a.offerId.localeCompare(b.offerId));
  return mosAvailabilitySchema.parse(result);
}
