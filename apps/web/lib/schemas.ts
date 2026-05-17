import { z } from "zod";

export const venueTypeSchema = z.enum(["school", "bm_base"]);

export const venueSchema = z.object({
  slug: z.string(),
  name: z.string(),
  type: venueTypeSchema,
  address: z.string(),
  metro: z.string().optional(),
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
});

export type VenueOffer = z.infer<typeof venueOfferSchema>;

export const questSchema = z.object({
  slug: z.string(),
  worldSlug: z.string(),
  title: z.string(),
  /** Подзаголовок Hero на странице квеста */
  tagline: z.string(),
  /** Короткая строка для каталога; если нет — показываем tagline */
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
  parentName: z.string().min(1, "Укажите имя"),
  contact: z.string().min(5, "Телефон или email"),
  consent: z
    .boolean()
    .refine((v) => v === true, { message: "Нужно согласие на обработку данных" }),
  questSlug: z.string(),
  questTitle: z.string(),
  offerId: z.string(),
  venueSlug: z.string(),
  venueName: z.string(),
  schoolSlug: z.string().optional(),
});

export type LeadPayload = z.infer<typeof leadSchema>;
