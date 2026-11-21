import type { VenueOffer } from "../../apps/web/lib/schemas";
import { isRetiredAnnualGroup } from "../../apps/web/content/annual-retirements.mjs";
import { venueOfferSchema } from "../../apps/web/lib/schemas";
import { z } from "../../apps/web/node_modules/zod/index.js";
import { mosAvailabilitySchema, mosAvailabilityBinding, sameMosBinding, type MosAvailability } from "../../apps/web/lib/offers/mos-availability";
import { annualMosCardSchema, retainMosReviewError } from "../../apps/web/lib/offers/annual-schedule";
import { fetchMosCard, validateProjectedMosCard } from "./mos-annual-cards.mjs";
import { groupLifecycle, moscowDate } from "./mos-group-lifecycle.mjs";

const snapshotSchema=z.object({version:z.literal(1),generatedAt:z.string(),offersByQuest:z.record(z.string(),z.array(venueOfferSchema))});
type Card=z.infer<typeof annualMosCardSchema>;
export const publicOffersSchema=snapshotSchema;
export const safeMosError=(error:unknown)=> error instanceof Error && /^MOS_[A-Z0-9_]+$/.test(error.message)
  ? error.message : error instanceof Error && /timeout/i.test(error.name) ? "MOS_TIMEOUT" : "MOS_FETCH_FAILED";

// Reviewed against direct MOS reads on 2026-11-18; school37 beginner level
// was explicitly confirmed by the owner. Raw historical registry stays intact.
const reviewedTitles=[
 {cardId:'1099851',listingId:'2600825',groupCode:'К2339-26',
  before:'26/27 Школа молодого инженера. Второй год обучения.',after:'Группа 3. 6-13 лет. Локтеева И. Д. Маршала Захарова, 25.'},
 {cardId:'923308',listingId:'2415012',groupCode:'К7419-26',
  before:'3ПУ, Школа молодого IT-инженера (1 год обучения), ул. Маршала Тухачевского, д.58, корп.2, Хмельков Д.А.',
  after:'3ПУ, Школа молодого IT-инженера (1 год обучения, 1 группа), ул. Маршала Тухачевского, д.58, корп.2, Хмельков Д.А.'},
 {cardId:'1019244',listingId:'2553800',groupCode:'К2765-26',
  before:'ШМИ продолжающие (СР 16:15-17:00) 2026-2027',after:'ШМИ начинающие (СР 16:15-17:00) 2026-2027'},
];
function matchesReviewedTitle(expected:Card,fresh:Card){
 return fresh.title.trim()===expected.title.trim()||reviewedTitles.some(r=>
  r.cardId===fresh.cardId&&r.listingId===fresh.listingId&&r.groupCode===fresh.groupCode&&
  r.before===expected.title.trim()&&r.after===fresh.title.trim());
}

/** Public reads only; no credentials, files, Sheets writes, or content compilation. */
export async function refreshMosAvailability(input:unknown, identities:Record<string,Card>, previous?:MosAvailability, options:{
  now?:()=>Date; fetchCard?:typeof fetchMosCard; concurrency?:number; budgetMs?:number; minIntervalMs?:number; sleep?:(ms:number)=>Promise<void>;
}={}) {
  const snapshot=snapshotSchema.parse(input);
  const now=options.now??(()=>new Date()); const start=now();
  const concurrency=options.concurrency??3;
  const budgetMs=options.budgetMs??230_000;
  if(!Number.isFinite(budgetMs)||budgetMs<=0||budgetMs>230_000)throw Error("MOS_BUDGET_INVALID");
  if(!Number.isInteger(concurrency)||concurrency<1||concurrency>3)throw Error("MOS_CONCURRENCY_INVALID");
  const minIntervalMs=options.minIntervalMs??1000;
  if(!Number.isInteger(minIntervalMs)||minIntervalMs<0||minIntervalMs>5000)throw Error("MOS_INTERVAL_INVALID");
  const sleep=options.sleep??(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
  const offers=Object.values(snapshot.offersByQuest).flat();
  if(offers.length>1000 || new Set(offers.map(o=>o.id)).size!==offers.length)throw Error("MOS_SNAPSHOT_INVALID");
  const result:MosAvailability={version:1,attemptedAt:start.toISOString(),completedAt:start.toISOString(),expected:0,verified:0,archived:0,errors:[],entries:{}};
  const current:VenueOffer[]=[];
  for(const offer of offers){
    // Preliminary camps use owner-reviewed facts and BrainMaster registration.
    if(offer.preliminary || offer.localAnnual)continue;
    if(isRetiredAnnualGroup(offer)){result.archived++;continue;}
    const lifecycle=groupLifecycle({...offer,...offer.scheduleCard},moscowDate(now()));
    if(lifecycle.state==='archived'){result.archived++;continue;}
    result.expected++;
    if(!offer.annual){result.errors.push({offerId:offer.id,code:"MOS_LEGACY_SOURCE_UNSUPPORTED"});continue;}
    if(lifecycle.state==='unknown'){result.errors.push({offerId:offer.id,code:lifecycle.reason});continue;}
    current.push(offer);
  }
  const fetchCard=options.fetchCard??fetchMosCard;
  // Rotate deterministically each cycle, with previously unattempted groups first.
  // A permanently failing card must not monopolise the beginning of every run.
  const rotation=current.length ? Math.floor(start.getTime()/300_000)%current.length : 0;
  const ordered=[...current.slice(rotation),...current.slice(0,rotation)];
  ordered.sort((a,b)=>Number(previous?.entries[b.id]?.error==='MOS_RUN_BUDGET')-Number(previous?.entries[a.id]?.error==='MOS_RUN_BUDGET'));
  const retry:VenueOffer[]=[];
  const transient=(code:string)=>['MOS_TIMEOUT','MOS_FETCH_FAILED','MOS_HTTP_500','MOS_HTTP_502','MOS_HTTP_503','MOS_HTTP_504'].includes(code);
  const remaining=()=>budgetMs-(now().getTime()-start.getTime());
  let lastStartedAt=start.getTime()-minIntervalMs;
  let permit=Promise.resolve();
  async function pace(startRequest:()=>Promise<Card>){
    const turn=permit.then(async()=>{
      const delay=Math.max(0,lastStartedAt+minIntervalMs-now().getTime());
      if(delay>=remaining())throw Error("MOS_RUN_BUDGET");
      if(delay>0)await sleep(delay);
      if(remaining()<=0)throw Error("MOS_RUN_BUDGET");
      // Use actual start, not a reserved slot: a delayed worker must not cause
      // several requests to catch up in a burst after the event loop resumes.
      lastStartedAt=now().getTime();
      return {request:startRequest()};
    });
    permit=turn.then(()=>{},()=>{});
    const {request}=await turn;return request;
  }
  async function attempt(offer:VenueOffer,second=false){
      const binding=mosAvailabilityBinding(offer);
      if(!binding){result.errors.push({offerId:offer.id,code:"MOS_DIRECT_CARD_REQUIRED"});return;}
      const candidate=previous?.entries[offer.id];
      const old=candidate&&sameMosBinding(candidate.binding,binding)?candidate:undefined;
      const retained=old?.availability;
      try{
        if(isRetiredAnnualGroup(offer))throw Error("MOS_OWNER_RETIRED");
        if(remaining()<=0)throw Error("MOS_RUN_BUDGET");
        if(groupLifecycle(offer,moscowDate(now())).state==='archived')throw Error("MOS_COURSE_ENDED");
        const expected=identities[offer.id.replace(/^year:/,"")];
        if(!expected || expected.cardId!==binding.cardId || expected.listingId!==binding.listingId || expected.groupCode!==binding.groupCode)throw Error("MOS_IDENTITY_REVIEW_REQUIRED");
        const fresh=await pace(()=>{
          if(groupLifecycle(offer,moscowDate(now())).state==='archived')throw Error("MOS_COURSE_ENDED");
          return fetchCard(binding.cardId,{listingId:binding.listingId,groupCode:binding.groupCode},{timeoutMs:Math.max(1,Math.min(8000,Math.floor(remaining())))});
        });
        validateProjectedMosCard(fresh);
        if(fresh.cardId!==binding.cardId||fresh.listingId!==binding.listingId||fresh.groupCode!==binding.groupCode)throw Error("MOS_IDENTITY_CHANGED");
        if(fresh.address!==expected.address||fresh.organization!==expected.organization)throw Error("MOS_LOCATION_REVIEW_REQUIRED");
        const slots=fresh.slots.map((s:{weekday:string;start:string;end:string})=>`${s.weekday}|${s.start}|${s.end}`).sort().join(';');
        // MOS may add boundary whitespace without changing the course identity.
        // Dates, slots and all meaningful title characters remain review gates.
        if(fresh.courseStart!==binding.startDate||fresh.courseEnd!==binding.endDate||slots!==binding.slots||!matchesReviewedTitle(expected,fresh))throw Error("MOS_SCHEDULE_REVIEW_REQUIRED");
        if(fresh.totalSeats===null||fresh.totalSeats<=0||fresh.freeSeats===null)throw Error("MOS_PARTIAL_FIELDS");
        const checkedAt=now().toISOString();
        if(checkedAt<start.toISOString() || (retained && checkedAt<=retained.checkedAt))throw Error("MOS_CLOCK_STALE");
        result.entries[offer.id]={binding,availability:{checkedAt,totalSeats:fresh.totalSeats,freeSeats:fresh.freeSeats,admission:fresh.status}};
        result.verified++;
        if(second)result.errors=result.errors.filter(e=>e.offerId!==offer.id);
      }catch(error){
        const reason=safeMosError(error);
        // No second attempt means no replacement of the first attempt's real error.
        if(second&&reason==='MOS_RUN_BUDGET')return;
        const code=retainMosReviewError(old?.error,reason);
        if(second)result.errors=result.errors.filter(e=>e.offerId!==offer.id);
        result.errors.push({offerId:offer.id,code});
        if(!second&&transient(reason))retry.push(offer);
        result.entries[offer.id]={binding,...(retained?{availability:retained}:{}),error:code};
      }
  }
  async function drain(queue:VenueOffer[],second=false){
    let cursor=0;
    await Promise.all(Array.from({length:Math.min(concurrency,queue.length)},async()=>{
      for(;;){const index=cursor++;if(index>=queue.length)return;
        if(second&&remaining()<=0)return;
        await attempt(queue[index],second);
      }
    }));
  }
  await drain(ordered);
  // Retry only after every group had its first opportunity; never retry 429 or
  // semantic review failures. Rate-limited cards wait for the next timer tick.
  await drain(retry,true);
  result.completedAt=now().toISOString();
  result.errors.sort((a,b)=>a.offerId.localeCompare(b.offerId));
  return mosAvailabilitySchema.parse(result);
}
