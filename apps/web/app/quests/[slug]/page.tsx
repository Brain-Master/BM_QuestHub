import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ContentSection } from "@/components/content-section";
import { QuestHeroBanner } from "@/components/quest-hero-banner";
import { QuestHeroMeta } from "@/components/quest-hero-meta";
import { OfferScheduleTable } from "@/components/offer-schedule-table";
import {
  loadQuestBySlug,
  loadQuests,
  loadVenues,
  loadWorldBySlug,
  venueBySlugMap,
} from "@/lib/content/load";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const quests = await loadQuests();
  return quests.map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quest = await loadQuestBySlug(slug);
  if (!quest) return { title: "Квест не найден" };
  const desc = quest.catalogTagline ?? quest.tagline;
  const ogImages =
    quest.heroImageUrl?.startsWith("http") && quest.heroImageUrl.length > 8
      ? [{ url: quest.heroImageUrl, alt: quest.title }]
      : undefined;
  return {
    title: quest.title,
    description: desc,
    openGraph: {
      title: quest.title,
      description: desc,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: quest.title,
      description: desc,
      ...(ogImages?.[0]?.url ? { images: [ogImages[0].url] } : {}),
    },
  };
}

export default async function QuestPage({ params }: Props) {
  const { slug } = await params;

  const quest = await loadQuestBySlug(slug);
  if (!quest) notFound();

  const [venues, world] = await Promise.all([
    loadVenues(),
    loadWorldBySlug(quest.worldSlug),
  ]);

  const vmap = venueBySlugMap(venues);
  const rows = quest.offers
    .map((offer) => {
      const venue = vmap.get(offer.venueSlug);
      if (!venue) return null;
      return { offer, venue };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <article
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-10"
      data-world={world?.themeKey ?? "portal"}
    >
      <div className="mb-8 space-y-6">
        {!quest.activeInCampaign ? (
          <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-amber-50 text-sm">
            Эта карточка не отмечена как активная в текущей кампании — проверяйте
            даты и цены по операционному источнику.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="text-muted-foreground hover:text-foreground" href="/catalog">
            Каталог
          </Link>
          <span className="text-muted-foreground">/</span>
          {world ? (
            <>
              <Link
                className="text-muted-foreground hover:text-foreground"
                href={`/worlds/${world.slug}`}
              >
                {world.name}
              </Link>
              <span className="text-muted-foreground">/</span>
            </>
          ) : null}
          <span className="font-medium text-foreground">{quest.title}</span>
        </div>

        <QuestHeroBanner quest={quest} world={world} />

        <QuestHeroMeta quest={quest} />
      </div>

      <ContentSection title="Сюжет">
        <p className="whitespace-pre-line">{quest.story}</p>
      </ContentSection>

      <ContentSection title="Инженерный фокус (для родителей)">
        <p className="whitespace-pre-line">{quest.skillsParent}</p>
      </ContentSection>

      <ContentSection title="Результат и «лут»">
        <p className="whitespace-pre-line">{quest.loot}</p>
      </ContentSection>

      <ContentSection title="Подход BrainMaster">
        <p className="whitespace-pre-line">{quest.approach}</p>
      </ContentSection>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-card/35 p-6 backdrop-blur-md md:p-8">
        <h2 className="font-heading flex items-center gap-3 text-xl font-semibold tracking-tight">
          <span
            className="inline-block size-2 rounded-full bg-primary shadow-[0_0_14px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
            aria-hidden
          />
          Площадки и запись
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Если для строки ещё нет карточки mos.ru, кнопка открывает форму заявки
          в модальном окне — без потери контекста смены и площадки.
        </p>
        <Suspense
          fallback={
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
          }
        >
          <OfferScheduleTable
            quest={{ slug: quest.slug, title: quest.title }}
            rows={rows}
          />
        </Suspense>
      </section>
    </article>
  );
}
