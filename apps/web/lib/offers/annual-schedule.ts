import { z } from "zod";

export const weekdays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"] as const;
export const weeklySlotSchema = z.object({
  weekday: z.enum(weekdays),
  start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
}).strict().refine(s => s.start < s.end, "Invalid weekly time range");
const count = z.number().int().nonnegative().nullable();
/** Public, dated source facts; admission is independent of event lifecycle/capacity. */
export const annualMetadataSchema = z.object({
  sourceTitle: z.string().min(1).optional(),
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
}).strict().refine(m => m.totalSeats === null || m.freeSeats === null || m.freeSeats <= m.totalSeats, "Invalid annual capacity");
