import { z } from "zod";

export const venueTypeSchema = z.enum(["school", "bm_base"]);

export const venueSchema = z.object({
  slug: z.string(),
  name: z.string(),
  displayName: z.string().optional(),
  type: venueTypeSchema,
  address: z.string(),
  metro: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  logoUrl: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  /** Показывать площадку на странице /sites. По умолчанию true. */
  listedOnSites: z.boolean().optional().default(true),
  /** Если задано, площадка относится к школьному скоупу с этим slug (см. ?school=). Базы BM обычно без привязки. */
  schoolScopeSlug: z.string().nullable().optional(),
});

export type Venue = z.infer<typeof venueSchema>;

export const worldSchema = z.object({
  slug: z.string(),
  name: z.string(),
  /** Коротко для SEO / превью */
  description: z.string(),
  /** Ключ для data-world и темы в CSS */
  themeKey: z.string(),
  /** Подзаголовок на хабе мира */
  tagline: z.string(),
  /** Развёрнутое описание мира (1–3 абзаца) */
  pitch: z.string(),
  /** Маркетинговые буллеты «почему этот мир» */
  highlights: z.array(z.string()),
  /** Только embed-URL для iframe VK/YouTube */
  heroVideoUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
});

export type World = z.infer<typeof worldSchema>;

export const productFormatSchema = z.enum(["intensive", "year"]);

const urlStringSchema = z.string().url();

export const scheduleMediaImageSchema = z.object({
  url: urlStringSchema,
  alt: z.string().optional(),
  /** Проценты 0..100 для CSS object-position. */
  focalPoint: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional(),
});

export const scheduleMediaSchema = z.object({
  /** Основной кадр для detailed card и мобильного hero. */
  hero: scheduleMediaImageSchema.optional(),
  /** Отдельно подготовленный кадр для compact/list режимов. */
  compact: scheduleMediaImageSchema.optional(),
  /** Брендовый или world-level fallback, если у смены нет уникального кадра. */
  fallback: scheduleMediaImageSchema.optional(),
});

const nullableOptionalString = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? undefined);

export const scheduleVariantSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  time: z.string().min(1),
  priceLabel: z.string().min(1),
  note: z.string().nullable().optional(),
  ageLabel: nullableOptionalString,
  mosRuCode: nullableOptionalString,
  mosBookingUrl: nullableOptionalString,
});

export const scheduleCardSchema = z.object({
  displayTitle: nullableOptionalString,
  description: nullableOptionalString,
  teacherName: nullableOptionalString,
  tags: z.array(z.string()).default([]),
  timelineDate: nullableOptionalString,
  shortDate: nullableOptionalString,
  shiftNumber: nullableOptionalString,
  locationNote: nullableOptionalString,
  programFilterLabel: nullableOptionalString,
  ageLabel: nullableOptionalString,
  formatType: nullableOptionalString,
  formatTime: nullableOptionalString,
  formatNote: nullableOptionalString,
  mosRuCode: nullableOptionalString,
  /** Сырой операционный статус источника данных для UI-маппера расписания. */
  status: z.string().optional(),
  isArchived: z.boolean().default(false),
  /** Управляет CTA для sold-out: disabled или заявка в лист ожидания. */
  allowWaitlistWhenSoldOut: z.boolean().default(false),
  variants: z.array(scheduleVariantSchema).default([]),
  media: scheduleMediaSchema.optional(),
});

export type ScheduleMediaImage = z.infer<typeof scheduleMediaImageSchema>;
export type ScheduleMedia = z.infer<typeof scheduleMediaSchema>;
export type ScheduleVariant = z.infer<typeof scheduleVariantSchema>;
export type ScheduleCard = z.infer<typeof scheduleCardSchema>;

export const venueOfferSchema = z.object({
  id: z.string(),
  venueSlug: z.string(),
  shiftLabel: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{1,2}:\d{2}$/),
  endTime: z.string().regex(/^\d{1,2}:\d{2}$/),
  dateRange: z.string(),
  daySchedule: z.string(),
  priceLabel: z.string(),
  /** Если пусто или невалидный URL — показываем модалку с формой вместо перехода на mos.ru */
  mosBookingUrl: z.string().nullable().optional(),
  includedNote: z.string().optional(),
  /** Статус строки из операционной таблицы (для внутренней разметки / будущего UI) */
  sheetStatus: z.string().optional(),
  enrolled: z.number().int().nonnegative().optional(),
  maxCapacity: z.number().int().positive().optional(),
  /** UX/UI payload для новой витрины расписания. Backward-compatible: старые snapshots могут не иметь этого блока. */
  scheduleCard: scheduleCardSchema.optional(),
});

export type VenueOffer = z.infer<typeof venueOfferSchema>;

export const questSchema = z.object({
  slug: z.string(),
  worldSlug: z.string(),
  title: z.string(),
  /** Подзаголовок Hero на странице квеста */
  tagline: z.string(),
  /** Короткая строка для карточки курса; если нет — показываем tagline */
  catalogTagline: z.string().optional(),
  ageLabel: z.string(),
  format: productFormatSchema,
  skills: z.array(z.string()),
  difficulty: z.string().optional(),
  activeInCampaign: z.boolean(),
  /**
   * Только URL для iframe (VK video_ext / YouTube embed), не страница просмотра в соцсети.
   */
  heroVideoUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
  groupSize: z.string().optional(),
  /** Строка инфопанели: длительность и формат */
  durationLabel: z.string().optional(),
  /** Нейтральная формулировка про цену без цифр из черновиков */
  priceHint: z.string().optional(),
  story: z.string(),
  skillsParent: z.string(),
  loot: z.string(),
  approach: z.string(),
  /** Смены подставляются из `data/offers-snapshot.json` (синк Google Sheet); в YAML можно не указывать */
  offers: z.array(venueOfferSchema).default([]),
});

export type Quest = z.infer<typeof questSchema>;

export const leadSchema = z.object({
  leadType: z.enum(["booking", "waitlist"]).default("booking"),
  parentName: z.string().min(1, "Укажите имя"),
  contact: z.string().min(5, "Телефон или email"),
  childName: z.string().min(1, "Укажите имя ребёнка"),
  childAge: z.string().min(1, "Укажите возраст или класс"),
  comment: z.string().optional(),
  consent: z
    .boolean()
    .refine((v) => v === true, { message: "Нужно согласие на обработку данных" }),
  questSlug: z.string(),
  questTitle: z.string(),
  offerId: z.string(),
  variantId: z.string().optional(),
  variantTitle: z.string().optional(),
  venueSlug: z.string(),
  venueName: z.string(),
  schoolSlug: z.string().optional(),
});

export type LeadFormInput = z.input<typeof leadSchema>;
export type LeadPayload = z.infer<typeof leadSchema>;
