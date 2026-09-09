import { z } from "zod";
import { weeklySlotSchema } from "./offers/annual-schedule";
import { annualProgrammeName } from "./offers/annual-programme-name";
import type { Quest, Venue } from "@/lib/schemas";

const nullableCount = z.number().int().nonnegative().nullable();
const date = z.iso.date();
const slot = weeklySlotSchema;
const group = z.object({
  id:z.string().min(1), groupCode:z.string().nullable(), listingId:z.string().regex(/^\d+$/),
  programme:z.literal("shmi"), title:z.string().min(1), sourceTitle:z.string().optional(), locationId:z.string().min(1),
  teacher:z.string().nullable(), status:z.enum(["open","closed"]),
  refreshedAt:z.iso.datetime().optional(),refreshError:z.string().regex(/^[A-Z][A-Z0-9_]+$/).optional(),
  totalSeats:nullableCount,freeSeats:nullableCount,ageMin:nullableCount,ageMax:nullableCount,
  lessonPrice:nullableCount,coursePrice:nullableCount,courseStart:date,courseEnd:date,
  slots:z.array(slot).min(1), link:z.url(),linkKind:z.enum(["card","search"]),limitedSource:z.boolean(),
}).strict().refine(g=>g.courseStart<=g.courseEnd,"Invalid course dates")
  .refine(g=>g.totalSeats===null||g.freeSeats===null||g.freeSeats<=g.totalSeats,"Invalid seats")
  .refine(g=>g.ageMin===null||g.ageMax===null||g.ageMin<=g.ageMax,"Invalid ages")
  .refine(g=>new Set(g.slots.map(s=>`${s.weekday}:${s.start}:${s.end}`)).size===g.slots.length,"Duplicate weekly slot")
  .refine(g=>g.linkKind==="card"
    ? /^https:\/\/www\.mos\.ru\/pgu2\/activity\/card\/\d+$/.test(g.link)
    : g.link===`https://www.mos.ru/pgu2/activity/groups?keyword=${g.listingId}`,"Unsafe mos.ru link");
export const yearScheduleSchema=z.object({
  version:z.literal(1),asOf:date,sourceSha256:z.string().regex(/^[a-f0-9]{64}$/),
  locations:z.array(z.object({id:z.string(),school:z.string(),address:z.string(),metro:z.string().nullable(),schoolScopeSlug:z.string().optional(),latitude:z.number().optional(),longitude:z.number().optional()}).strict()),
  groups:z.array(group),
}).strict().superRefine((value,ctx)=>{
  const ids=new Set(value.locations.map(l=>l.id));
  if(ids.size!==value.locations.length||new Set(value.groups.map(g=>g.id)).size!==value.groups.length)
    ctx.addIssue({code:"custom",message:"Duplicate schedule identity"});
  if(value.groups.some(g=>!ids.has(g.locationId)))
    ctx.addIssue({code:"custom",message:"Unknown location"});
});
export type YearScheduleData=z.infer<typeof yearScheduleSchema>;
/** Projection of the same course/venue/offer data consumed by the map. */
export function projectAnnualWorkspace(quests: Quest[], venues: Venue[]): YearScheduleData {
  const offers = quests.filter(q => q.format === "year").flatMap(q => q.offers).filter(o => o.annual);
  const dates = new Set(offers.map(o => o.annual?.asOf));
  const hashes = new Set(offers.map(o => o.annual?.sourceSha256));
  if (dates.size > 1 || hashes.size > 1) throw Error("Mixed annual source revisions");
  const used = new Set(offers.map(o => o.venueSlug));
  return yearScheduleSchema.parse({
    version: 1, asOf: offers[0]?.annual?.asOf ?? "2026-09-08", sourceSha256: offers[0]?.annual?.sourceSha256 ?? "0".repeat(64),
    locations: venues.filter(v => used.has(v.slug)).map(v => ({ id:v.slug, school:v.name.replace(/№\s*(\d+)/,"№ $1"), address:v.address, metro:v.metro??null, schoolScopeSlug:v.schoolScopeSlug??v.slug, latitude:v.latitude, longitude:v.longitude })),
    groups: offers.map(o => {
      const a = o.annual;
      if (!a || !o.weeklySlots?.length || !o.mosBookingUrl) throw Error("Incomplete annual offer");
      const sourceTitle = a.sourceTitle ?? o.scheduleCard?.displayTitle ?? o.shiftLabel;
      return { id:o.id.startsWith("year:")?o.id.slice(5):o.id,groupCode:a.groupCode,listingId:a.listingId,programme:"shmi",title:annualProgrammeName(sourceTitle,a.studyYear).full,sourceTitle,locationId:o.venueSlug,
        teacher:a.teacher,status:a.admission,refreshedAt:a.refreshedAt,refreshError:a.refreshError,totalSeats:a.totalSeats,freeSeats:a.freeSeats,ageMin:a.ageMin,ageMax:a.ageMax,lessonPrice:a.lessonPrice,coursePrice:a.coursePrice,courseStart:o.startDate,courseEnd:o.endDate,slots:o.weeklySlots,link:o.mosBookingUrl,linkKind:a.linkKind,limitedSource:a.limitedSource };
    }),
  });
}
