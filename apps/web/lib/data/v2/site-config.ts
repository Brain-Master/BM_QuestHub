import { z } from "zod";

import { cityConfigSchema } from "@/lib/data/v2/entities";
import { snapshotIntegritySchema } from "@/lib/data/v2/shared";

export const brandProfileSchema = z.object({
  legalName: z.string().min(1),
  siteTitle: z.string().min(1),
  contacts: z.object({
    supportPhone: z.string().min(1),
    supportPhoneHref: z.string().min(1),
    legalEmail: z.string().min(1),
    legalEmailHref: z.string().min(1),
  }),
});

export const navigationProgramSchema = z.object({
  label: z.string().min(1),
  slug: z.string().min(1),
});

export const navigationWorldGroupSchema = z.object({
  label: z.string().min(1),
  slug: z.string().min(1),
  programs: z.array(navigationProgramSchema),
});

export const navigationConfigSchema = z.object({
  worldGroups: z.array(navigationWorldGroupSchema),
});

export const metroLineDictionaryEntrySchema = z.object({
  number: z.string().min(1),
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const mapPercentPointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const mapConfigSchema = z.object({
  bounds: z.object({
    west: z.number(),
    east: z.number(),
    north: z.number(),
    south: z.number(),
  }),
  metroAnchors: z.record(z.string(), mapPercentPointSchema),
  fallbackAnchors: z.array(mapPercentPointSchema),
});

export const registrationFlowCopySchema = z.object({
  mosAssist: z.object({
    title: z.string(),
    noticeTitle: z.string(),
    noticeText: z.string(),
    submitLabel: z.string(),
    successTitle: z.string(),
    successText: z.string(),
  }),
  waitlist: z.object({
    title: z.string(),
    noticeTitle: z.string(),
    noticeText: z.string(),
    submitLabel: z.string(),
    successTitle: z.string(),
    successText: z.string(),
  }),
  waitlistPreliminary: z.object({
    title: z.string(),
    noticeTitle: z.string(),
    noticeText: z.string(),
    submitLabel: z.string(),
    successTitle: z.string(),
    successText: z.string(),
  }),
  brainmaster: z.object({
    title: z.string(),
    noticeTitle: z.string(),
    noticeText: z.string(),
    submitLabel: z.string(),
    successTitle: z.string(),
    successText: z.string(),
  }),
});

export const publicDictionariesSchema = z.object({
  registrationChannels: z.record(z.string(), z.string()),
  eventStatus: z.record(
    z.string(),
    z.object({
      label: z.string(),
      variant: z.enum([
        "success",
        "info",
        "purple",
        "warning",
        "default",
        "destructive",
      ]),
    }),
  ),
  metroLines: z.record(z.string(), metroLineDictionaryEntrySchema),
  registrationFlow: registrationFlowCopySchema,
});

export const legalDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  route: z.string().min(1),
});

export const siteConfigSchema = z.object({
  version: z.literal(2),
  generatedAt: z.string(),
  source: z.string(),
  integrity: snapshotIntegritySchema.optional(),
  brand: brandProfileSchema,
  navigation: navigationConfigSchema,
  cities: z.array(cityConfigSchema),
  map: mapConfigSchema,
  dictionaries: publicDictionariesSchema,
  legal: z.array(legalDocumentSchema).default([]),
});

export type BrandProfile = z.infer<typeof brandProfileSchema>;
export type NavigationConfig = z.infer<typeof navigationConfigSchema>;
export type MapConfig = z.infer<typeof mapConfigSchema>;
export type PublicDictionaries = z.infer<typeof publicDictionariesSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;
