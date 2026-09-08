import { z } from "zod";
import data from "@/content/year-schedule.generated.json";

const nullableCount = z.number().int().nonnegative().nullable();
const date = z.iso.date();
const slot = z.object({
  weekday: z.enum(["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"]),
  start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
}).strict().refine(s=>s.start<s.end,"Invalid time range");
const group = z.object({
  id:z.string().min(1), groupCode:z.string().nullable(), listingId:z.string().regex(/^\d+$/),
  programme:z.literal("shmi"), title:z.string().min(1), locationId:z.string().min(1),
  teacher:z.string().nullable(), status:z.enum(["open","closed"]),
  totalSeats:nullableCount,freeSeats:nullableCount,ageMin:nullableCount,ageMax:nullableCount,
  lessonPrice:nullableCount,coursePrice:nullableCount,courseStart:date,courseEnd:date,
  slots:z.array(slot).min(1), link:z.url(),linkKind:z.enum(["card","search"]),limitedSource:z.boolean(),
}).strict().refine(g=>g.courseStart<=g.courseEnd,"Invalid course dates")
  .refine(g=>g.totalSeats===null||g.freeSeats===null||g.freeSeats<=g.totalSeats,"Invalid seats")
  .refine(g=>g.linkKind==="card"
    ? /^https:\/\/www\.mos\.ru\/pgu2\/activity\/card\/\d+$/.test(g.link)
    : g.link===`https://www.mos.ru/pgu2/activity/groups?keyword=${g.listingId}`,"Unsafe mos.ru link");
export const yearScheduleSchema=z.object({
  version:z.literal(1),asOf:date,sourceSha256:z.string().regex(/^[a-f0-9]{64}$/),
  locations:z.array(z.object({id:z.string(),school:z.string(),address:z.string(),metro:z.string().nullable()}).strict()),
  groups:z.array(group),
}).strict().superRefine((value,ctx)=>{
  const ids=new Set(value.locations.map(l=>l.id));
  if(ids.size!==value.locations.length||new Set(value.groups.map(g=>g.id)).size!==value.groups.length)
    ctx.addIssue({code:"custom",message:"Duplicate schedule identity"});
  if(value.groups.some(g=>!ids.has(g.locationId)))
    ctx.addIssue({code:"custom",message:"Unknown location"});
});
export type YearScheduleData=z.infer<typeof yearScheduleSchema>;
export function loadYearSchedule():YearScheduleData { return yearScheduleSchema.parse(data); }
