import { z } from "zod";

export const weekdays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"] as const;
export const weeklySlotSchema = z.object({
  weekday: z.enum(weekdays),
  start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
}).strict().refine(s => s.start < s.end, "Invalid weekly time range");
const count = z.number().int().nonnegative().nullable();
/** Only transient transport/partial-read failures may retain a verified booking URL. */
export function annualBookingNeedsReview(metadata?: {refreshError?: string}): boolean {
  const error=metadata?.refreshError;
  return !!error && !/^MOS_(?:HTTP_\d{3}|TIMEOUT|FETCH_FAILED|PARTIAL_FIELDS|NON_JSON|INVALID_RESPONSE|RESPONSE_TOO_LARGE)$/.test(error);
}
/** Public, dated source facts; admission is independent of event lifecycle/capacity. */
export const annualMetadataSchema = z.object({
  sourceTitle: z.string().min(1).optional(),
  studyYear: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  refreshedAt: z.iso.datetime().optional(),
  refreshError: z.string().regex(/^[A-Z][A-Z0-9_]+$/).optional(),
  teacherSourceConflict: z.boolean().optional(),
  asOf: z.iso.date(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  listingId: z.string().regex(/^\d+$/),
  groupCode: z.string().nullable(),
  admission: z.enum(["open", "closed"]),
  teacher: z.string().nullable(),
  ageMin: count, ageMax: count,
  totalSeats: count, freeSeats: count,
  lessonPrice: count, coursePrice: count,
  linkKind: z.enum(["card", "search"]),
  limitedSource: z.boolean(),
}).strict().refine(m => m.totalSeats === null || m.freeSeats === null || m.freeSeats <= m.totalSeats, "Invalid annual capacity")
  .refine(m => m.ageMin === null || m.ageMax === null || m.ageMin <= m.ageMax, "Invalid annual ages");

export const annualMosCardSchema = z.object({
  cardId: z.string().regex(/^\d+$/), listingId: z.string().regex(/^\d+$/), groupCode: z.string().min(1),
  title: z.string().min(1), address: z.string().min(1), organization: z.string().min(1),
  teacher: z.string().nullable(), totalSeats: count, freeSeats: count,
  ageMin: count, ageMax: count, lessonPrice: count, coursePrice: count,
  courseStart: z.iso.date(), courseEnd: z.iso.date(), slots: z.array(weeklySlotSchema).min(1),
  status: z.enum(["open", "closed"]), link: z.string(), refreshedAt: z.iso.datetime(),
}).strict().superRefine((m, ctx) => {
  if (m.link !== `https://www.mos.ru/pgu2/activity/card/${m.cardId}` || m.courseStart > m.courseEnd ||
    (m.ageMin !== null && m.ageMax !== null && m.ageMin > m.ageMax) ||
    (m.totalSeats !== null && m.freeSeats !== null && m.freeSeats > m.totalSeats) ||
    new Set(m.slots.map(s => `${s.weekday}:${s.start}:${s.end}`)).size !== m.slots.length) {
    ctx.addIssue({ code: "custom", message: "Invalid live annual card" });
  }
});
export const annualMosRefreshSchema = z.object({
  version: z.literal(1), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  attemptedAt: z.iso.datetime(), expectedGroups: z.number().int().nonnegative(),
  verifiedGroups: z.number().int().nonnegative(), ok: z.boolean(),
  archivedGroups: z.number().int().nonnegative().optional(),
  groups: z.record(z.string(), annualMosCardSchema),
  candidates: z.record(z.string(), z.array(z.object({cardId:z.number(),groupCode:z.string(),title:z.string(),address:z.string()}))).optional(),
  errors: z.array(z.object({groupId:z.string().optional(),listingId:z.string().optional(),phase:z.string(),code:z.string()})),
}).strict().superRefine((r,ctx) => {
  if (r.verifiedGroups > Object.keys(r.groups).length || Object.keys(r.groups).length > r.expectedGroups ||
    r.verifiedGroups + (r.archivedGroups ?? 0) > r.expectedGroups ||
    r.ok !== (r.verifiedGroups + (r.archivedGroups ?? 0) === r.expectedGroups && r.errors.length === 0)) {
    ctx.addIssue({code:"custom",message:"Inconsistent annual refresh coverage"});
  }
});
