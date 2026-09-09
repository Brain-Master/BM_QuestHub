import { z } from "zod";
import { weekdays } from "@/lib/offers/annual-schedule";

export const snapshotIntegritySchema = z.object({
  schemaHash: z.string().optional(),
  contentHash: z.string().optional(),
});

export const publicBadgeSchema = z.object({
  label: z.string().min(1),
  tone: z.enum(["default", "success", "warning", "info", "muted"]).optional(),
});

export const timeRangeSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
});

export const scheduleSlotSchema = z.object({
  weekday: z.enum(weekdays).optional(),
  label: z.string().optional(),
  timeRange: timeRangeSchema.optional(),
});

export const scheduleMediaImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  focalPoint: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional(),
});

export const scheduleMediaSchema = z.object({
  hero: scheduleMediaImageSchema.optional(),
  compact: scheduleMediaImageSchema.optional(),
  fallback: scheduleMediaImageSchema.optional(),
});

export type SnapshotIntegrity = z.infer<typeof snapshotIntegritySchema>;
export type PublicBadge = z.infer<typeof publicBadgeSchema>;
