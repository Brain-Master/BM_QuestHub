import { z } from "zod";
import { isRetiredAnnualGroup } from "../../content/annual-retirements.mjs";
import type { Quest, VenueOffer } from "../schemas";
import { retainMosReviewError } from './annual-schedule';

const bindingSchema = z.object({
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  asOf: z.iso.date(), venueSlug: z.string().min(1),
  listingId: z.string().regex(/^\d+$/), groupCode: z.string().min(1),
  cardId: z.string().regex(/^\d+$/), startDate: z.iso.date(), endDate: z.iso.date(),
  slots: z.string().min(1),
}).strict();
const availabilitySchema = z.object({
  checkedAt: z.iso.datetime(), totalSeats: z.number().int().positive(),
  freeSeats: z.number().int().nonnegative(), admission: z.enum(["open", "closed"]),
}).strict().refine(v => v.freeSeats <= v.totalSeats, "Invalid capacity");
const entrySchema = z.object({
  binding: bindingSchema,
  availability: availabilitySchema.optional(),
  error: z.string().regex(/^MOS_[A-Z0-9_]+$/).optional(),
}).strict().refine(v => !!v.availability || !!v.error, "Empty availability entry");
export const mosAvailabilitySchema = z.object({
  version: z.literal(1), attemptedAt: z.iso.datetime(), completedAt: z.iso.datetime(),
  expected: z.number().int().nonnegative(), verified: z.number().int().nonnegative(),
  archived: z.number().int().nonnegative(),
  errors: z.array(z.object({offerId:z.string(), code:z.string().regex(/^MOS_[A-Z0-9_]+$/)}).strict()),
  entries: z.record(z.string(), entrySchema),
}).strict().superRefine((v, ctx) => {
  if (v.completedAt < v.attemptedAt || v.verified + v.errors.length !== v.expected ||
      new Set(v.errors.map(e=>e.offerId)).size !== v.errors.length ||
      Object.values(v.entries).filter(e=>!e.error).length !== v.verified ||
      Object.entries(v.entries).some(([id,e])=> e.error && !v.errors.some(x=>x.offerId===id&&x.code===e.error)) ||
      Object.values(v.entries).some(e=>e.availability && (e.availability.checkedAt > v.completedAt || (!e.error && e.availability.checkedAt < v.attemptedAt)))) {
    ctx.addIssue({code:"custom",message:"Inconsistent availability coverage"});
  }
});
export type MosAvailability = z.infer<typeof mosAvailabilitySchema>;
export type MosAvailabilityBinding = z.infer<typeof bindingSchema>;

export function mosAvailabilityBinding(offer: VenueOffer): MosAvailabilityBinding | null {
  const a=offer.annual;
  const card=offer.mosBookingUrl?.match(/^https:\/\/www\.mos\.ru\/pgu2\/activity\/card\/(\d+)$/);
  if (!a || a.linkKind!=="card" || !card || !a.groupCode || !offer.weeklySlots?.length) return null;
  return bindingSchema.parse({sourceSha256:a.sourceSha256,asOf:a.asOf,venueSlug:offer.venueSlug,
    listingId:a.listingId,groupCode:a.groupCode,cardId:card[1],startDate:offer.startDate,endDate:offer.endDate,
    slots:offer.weeklySlots.map(s=>`${s.weekday}|${s.start}|${s.end}`).sort().join(";")});
}

export function sameMosBinding(a: MosAvailabilityBinding, b: MosAvailabilityBinding): boolean {
  return (Object.keys(a) as Array<keyof MosAvailabilityBinding>).every(key=>a[key]===b[key]);
}

/** Availability is an independent dated source; never overwrite full-card freshness/editorial facts. */
export function mergeMosAvailability(quests: Quest[], snapshot: MosAvailability | undefined, now = new Date()): Quest[] {
  if (!snapshot || Date.parse(snapshot.completedAt) > now.getTime()+60_000) return quests;
  return quests.map(quest=>({...quest,offers:quest.offers.map(offer=>{
    if(isRetiredAnnualGroup(offer))return offer;
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    if(offer.endDate<today || offer.scheduleCard?.isArchived || /^(?:archived|cancelled|архив|отменено)$/i.test(offer.scheduleCard?.status??offer.sheetStatus??''))return offer;
    const entry=snapshot.entries[offer.id]; const binding=mosAvailabilityBinding(offer);
    if (!entry || !binding || !sameMosBinding(binding,entry.binding) || !offer.annual) return offer;
    const fresh=entry.availability;
    // Never let an older seat reading overwrite a newer full-card refresh.
    const baselineAt=Math.max(Date.parse(offer.annual.refreshedAt??`${offer.annual.asOf}T00:00:00Z`),Date.parse(offer.annual.availabilityUpdatedAt??'1970-01-01'));
    const usable=fresh && Date.parse(fresh.checkedAt)>=baselineAt;
    if(Date.parse(snapshot.completedAt)<baselineAt)return offer;
    const annual={...offer.annual}; delete annual.availabilityError;
    return {...offer,
      ...(usable ? {enrolled:fresh.totalSeats-fresh.freeSeats,maxCapacity:fresh.totalSeats} : {}),
      annual:{...annual,
        ...(usable ? {totalSeats:fresh.totalSeats,freeSeats:fresh.freeSeats,admission:fresh.admission,availabilityUpdatedAt:fresh.checkedAt} : {}),
        ...(entry.error ? {availabilityError:entry.error} : {}),
      }};
  })}));
}

/** Preserve per-binding last-good readings; reject delayed whole responses rather than going backwards. */
export function reconcileMosAvailability(previous: MosAvailability | undefined, incoming: MosAvailability, now=new Date()): MosAvailability {
  if(Date.parse(incoming.completedAt)>now.getTime()+60_000 ||
    (previous && incoming.completedAt<previous.completedAt))throw Error('MOS_AVAILABILITY_STALE_RESPONSE');
  const result=structuredClone(incoming);
  for(const [id,entry] of Object.entries(result.entries)){
    const old=previous?.entries[id];
    if (old && sameMosBinding(old.binding,entry.binding) && entry.error) {
      entry.error=retainMosReviewError(old.error,entry.error);
      const error=result.errors.find(item=>item.offerId===id);
      if(error)error.code=entry.error;
    }
    if(old&&sameMosBinding(old.binding,entry.binding)&&old.availability&&
      (!entry.availability||entry.availability.checkedAt<old.availability.checkedAt)){
      if(!entry.error)throw Error('MOS_AVAILABILITY_STALE_RESPONSE');
      entry.availability=old.availability;
    }
  }
  return mosAvailabilitySchema.parse(result);
}
