import { z } from "zod";

import {
  questSchema,
  venueSchema,
  worldSchema,
} from "@/lib/schemas";
import { snapshotIntegritySchema } from "@/lib/data/v2/shared";

const snapshotMetaSchema = z.object({
  version: z.literal(2),
  generatedAt: z.string(),
  source: z.string().min(1),
  integrity: snapshotIntegritySchema.optional(),
});

/** Catalog cards: worlds + courses without runtime offers (merged at load). */
export const catalogSnapshotSchema = snapshotMetaSchema.extend({
  worlds: z.array(worldSchema),
  courses: z.array(questSchema.omit({ offers: true })),
});

export const mapSnapshotSchema = snapshotMetaSchema.extend({
  venues: z.array(venueSchema),
});

export const courseDetailSnapshotSchema = snapshotMetaSchema.extend({
  course: questSchema.omit({ offers: true }),
});

export type CatalogSnapshot = z.infer<typeof catalogSnapshotSchema>;
export type MapSnapshot = z.infer<typeof mapSnapshotSchema>;
export type CourseDetailSnapshot = z.infer<typeof courseDetailSnapshotSchema>;
