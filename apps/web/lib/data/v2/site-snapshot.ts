import { z } from "zod";

import {
  cityConfigSchema,
  courseV2Schema,
  eventV2Schema,
  universeV2Schema,
  venueV2Schema,
} from "@/lib/data/v2/entities";
import {
  brandProfileSchema,
  legalDocumentSchema,
  navigationConfigSchema,
  publicDictionariesSchema,
} from "@/lib/data/v2/site-config";
import { snapshotIntegritySchema } from "@/lib/data/v2/shared";

export const siteSnapshotV2Schema = z.object({
  version: z.literal(2),
  generatedAt: z.string(),
  source: z.string(),
  integrity: snapshotIntegritySchema,
  brand: brandProfileSchema,
  navigation: navigationConfigSchema,
  cities: z.array(cityConfigSchema),
  universes: z.array(universeV2Schema),
  courses: z.array(courseV2Schema),
  venues: z.array(venueV2Schema),
  events: z.array(eventV2Schema),
  dictionaries: publicDictionariesSchema,
  legal: z.array(legalDocumentSchema).default([]),
});

export const siteManifestV2Schema = z.object({
  version: z.literal(2),
  generatedAt: z.string(),
  source: z.string(),
  snapshots: z.record(
    z.string(),
    z.object({
      path: z.string().min(1),
      contentHash: z.string().optional(),
    }),
  ),
});

export const scheduleSnapshotV2Schema = z.object({
  version: z.literal(2),
  generatedAt: z.string(),
  source: z.string(),
  integrity: snapshotIntegritySchema.optional(),
  events: z.array(eventV2Schema),
});

export type SiteSnapshotV2 = z.infer<typeof siteSnapshotV2Schema>;
export type SiteManifestV2 = z.infer<typeof siteManifestV2Schema>;
export type ScheduleSnapshotV2 = z.infer<typeof scheduleSnapshotV2Schema>;
