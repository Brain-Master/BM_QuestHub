import groups from '../apps/lead-service/local-groups.json';
import { venueOfferSchema } from '../apps/web/lib/schemas';
/** Applied by the existing annual compiler on every sheet publication. No inventory in S3. */
export function localAnnualOffers(){return groups.map(g=>venueOfferSchema.parse({
 id:g.id,venueSlug:g.venueSlug,shiftLabel:g.audienceLabel,startDate:g.firstDate,endDate:g.endDate,
 startTime:g.start,endTime:g.end,dateRange:'25.10.2026 — 31.05.2027',daySchedule:`${g.weekday} ${g.start}–${g.end}`,
 weeklySlots:[{weekday:g.weekday,start:g.start,end:g.end}],priceLabel:'2 000 ₽ за 90 минут (2 ак. ч.)',
 localAnnual:{studyYear:g.studyYear,audienceLabel:g.audienceLabel,teacher:g.teacher,lessonMinutes:g.lessonMinutes,lessonPrice:g.lessonPrice},
 mosBookingUrl:null,maxCapacity:g.capacity,
 includedNote:'Место бронируется после успешной отправки заявки на сайте. Для отмены брони свяжитесь с BrainMaster.',
 scheduleCard:{displayTitle:g.title,ageLabel:g.audienceLabel,status:'open',registrationChannel:'brainmaster',teacherName:g.teacher,allowWaitlistWhenSoldOut:false,variants:[]},
}));}
export function overlayLocalAnnual<T extends {offersByQuest:Record<string,unknown[]>}>(snapshot:T):T{
 const rows=localAnnualOffers(),ids=new Set(rows.map(o=>o.id));
 return {...snapshot,offersByQuest:{...snapshot.offersByQuest,shmi:[...(snapshot.offersByQuest.shmi??[]).filter(o=>!ids.has((o as {id:string}).id)),...rows]}};
}
