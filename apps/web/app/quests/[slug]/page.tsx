import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { ContentSection } from "@/components/content-section";
import { QuestHeroBanner } from "@/components/quest-hero-banner";
import { QuestHeroMeta } from "@/components/quest-hero-meta";
import { LiveQuestSchedule } from "@/components/live-quest-schedule";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import {
  loadQuestBySlug,
  loadQuests,
  loadQuestsShell,
  loadScheduleSnapshotGeneratedAt,
  loadVenues,
  loadWorldBySlug,
  loadWorlds,
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
  const heroOg = resolvePublicMediaUrl(quest.heroImageUrl);
  const ogImages =
    heroOg?.startsWith("http") && heroOg.length > 8
      ? [{ url: heroOg, alt: quest.title }]
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

  const [venues, worlds, baseQuests, initialSnapshotGeneratedAt] = await Promise.all([
    loadVenues(),
    loadWorlds(),
    loadQuestsShell(),
    loadScheduleSnapshotGeneratedAt(),
  ]);
  const world = await loadWorldBySlug(quest.worldSlug);

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
            Курсы
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

      <ContentSection title="Что останется после интенсива?">
        <p className="whitespace-pre-line">{quest.skillsParent}</p>
      </ContentSection>

      <ContentSection title="Гаджет, сделанный своими руками">
        <p className="whitespace-pre-line">{quest.loot}</p>
      </ContentSection>

      <ContentSection title="Как проходит работа на интенсиве">
        <p className="whitespace-pre-line">{quest.approach}</p>
      </ContentSection>

      <CommunityConnectPanel
        variant="card"
        className="mb-8"
        {...communityConnectCopy.questBeforeSchedule}
      />

      <section
        id="schedule-offers"
        className="scroll-mt-28 rounded-2xl border border-white/10 bg-card/35 p-4 backdrop-blur-md sm:p-6 md:p-8"
      >
        <LiveQuestSchedule
          baseQuests={baseQuests}
          venues={venues}
          worlds={worlds}
          questSlug={slug}
          initialSnapshotGeneratedAt={initialSnapshotGeneratedAt}
        />
      </section>
    </article>
  );
}
