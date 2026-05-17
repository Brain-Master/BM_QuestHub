import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { QuestHeroBanner } from "@/components/quest-hero-banner";
import { QuestHeroMeta } from "@/components/quest-hero-meta";
import { ScheduleBoard } from "@/components/schedule-board";
import {
  loadQuestBySlug,
  loadQuests,
  loadVenues,
  loadWorldBySlug,
  venueBySlugMap,
} from "@/lib/content/load";
import {
  groupAgendaItems,
  type AgendaOfferItem,
} from "@/lib/offers/agenda";

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
  const agendaItems: AgendaOfferItem[] = quest.offers
    .map((offer) => {
      const venue = vmap.get(offer.venueSlug);
      if (!venue) return null;
      return {
        offer,
        quest: {
          slug: quest.slug,
          title: quest.title,
          worldSlug: quest.worldSlug,
          format: quest.format,
          ageLabel: quest.ageLabel,
          catalogTagline: quest.catalogTagline,
          tagline: quest.tagline,
          heroImageUrl: quest.heroImageUrl,
        },
        venue,
        world: world
          ? {
              slug: world.slug,
              name: world.name,
              themeKey: world.themeKey,
            }
          : null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const groups = groupAgendaItems(agendaItems);

  return (
    <article
      className="mx-auto w-full max-w-6xl flex-1 px-3 py-8 sm:px-4 sm:py-10"
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

      <section
        id="schedule-offers"
        className="scroll-mt-28 rounded-2xl border border-white/10 bg-card/35 p-4 backdrop-blur-md sm:p-6 md:p-8"
      >
        <ScheduleBoard
          groups={groups}
          title="Площадки и запись"
          description="Если для смены ещё нет карточки mos.ru, кнопка открывает форму заявки в модальном окне."
          showProgramFilter={false}
          displayMode="quest"
        />
      </section>
    </article>
  );
}
