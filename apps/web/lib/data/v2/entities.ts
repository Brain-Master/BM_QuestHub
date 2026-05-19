import { z } from "zod";

import {
  publicBadgeSchema,
  scheduleMediaSchema,
  scheduleSlotSchema,
  timeRangeSchema,
} from "@/lib/data/v2/shared";

export const eventStatusSchema = z.enum([
  "planning",
  "recruiting",
  "in_progress",
  "join_late",
  "sold_out",
  "waitlist",
  "finished",
  "cancelled",
]);

export const registrationChannelV2Schema = z.enum([
  "brainmaster",
  "mos_ru",
  "external",
]);

export const visualTreatmentSchema = z.enum([
  "default",
  "featured",
  "muted",
  "lowSeats",
]);

export const universeV2Schema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  themeKey: z.string().min(1),
  description: z.string().min(1),
  tagline: z.string().min(1),
});

export const courseV2Schema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  universeId: z.string().min(1),
  title: z.string().min(1),
  tagline: z.string().optional(),
  catalogTagline: z.string().optional(),
  ageLabel: z.string().optional(),
  format: z.enum(["intensive", "year"]).optional(),
  activeInCampaign: z.boolean().optional(),
});

export const venueV2Schema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["school", "bm_base"]),
  address: z.string().min(1),
  city: z.string().optional(),
  metro: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  listedOnSites: z.boolean().optional(),
});

export const cityConfigSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
  gradient: z.string().min(1),
});

export const eventVariantV2Schema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  timeLabel: z.string().optional(),
  timeRange: timeRangeSchema.optional(),
  price: z.object({
    amount: z.number().nonnegative().optional(),
    currency: z.literal("RUB").default("RUB"),
    label: z.string().min(1),
  }),
  ageLabel: z.string().optional(),
  note: z.string().optional(),
  registration: z
    .object({
      channel: registrationChannelV2Schema.optional(),
      mosRuCode: z.string().optional(),
      externalUrl: z.string().url().optional(),
    })
    .optional(),
  availability: z
    .object({
      isAvailable: z.boolean(),
      reason: z.string().optional(),
    })
    .optional(),
  presentation: z
    .object({
      badge: publicBadgeSchema.optional(),
      iconKey: z.string().optional(),
      sortOrder: z.number().int().optional(),
    })
    .optional(),
});

export const eventV2Schema = z.object({
  id: z.string().min(1),
  slug: z.string().optional(),
  relations: z.object({
    courseId: z.string().min(1),
    venueId: z.string().min(1),
  }),
  schedule: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timezone: z.string().min(1),
    slots: z.array(scheduleSlotSchema).default([]),
  }),
  status: z.object({
    value: eventStatusSchema,
    sourceRaw: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
  capacity: z
    .object({
      total: z.number().int().positive(),
      booked: z.number().int().nonnegative(),
      reserved: z.number().int().nonnegative().optional(),
    })
    .optional(),
  registration: z.object({
    channel: registrationChannelV2Schema,
    allowBooking: z.boolean(),
    allowWaitlist: z.boolean(),
    crmGroupId: z.string().optional(),
    externalUrl: z.string().url().optional(),
  }),
  presentation: z
    .object({
      titleOverride: z.string().optional(),
      descriptionOverride: z.string().optional(),
      teacherName: z.string().optional(),
      tags: z.array(z.string()).default([]),
      media: scheduleMediaSchema.optional(),
      timelineLabel: z.string().optional(),
      shortDateLabel: z.string().optional(),
      locationNote: z.string().optional(),
      badge: publicBadgeSchema.optional(),
      visualTreatment: visualTreatmentSchema.optional(),
      sortOrder: z.number().int().optional(),
    })
    .optional(),
  variants: z.array(eventVariantV2Schema).default([]),
});

export type EventStatusV2 = z.infer<typeof eventStatusSchema>;
export type UniverseV2 = z.infer<typeof universeV2Schema>;
export type CourseV2 = z.infer<typeof courseV2Schema>;
export type VenueV2 = z.infer<typeof venueV2Schema>;
export type CityConfig = z.infer<typeof cityConfigSchema>;
export type EventVariantV2 = z.infer<typeof eventVariantV2Schema>;
export type EventV2 = z.infer<typeof eventV2Schema>;
