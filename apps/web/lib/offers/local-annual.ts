import { z } from 'zod';
/** Owner-managed annual groups have no MOS identity or fabricated age bounds. */
export const localAnnualSchema=z.object({
  studyYear:z.literal(1),audienceLabel:z.string().min(1),teacher:z.string().min(1),
  lessonMinutes:z.literal(90),lessonPrice:z.number().int().positive(),
  availability:z.object({total:z.number().int().positive(),free:z.number().int().nonnegative(),open:z.boolean()}).refine(a=>a.free<=a.total).optional(),
}).strict();
