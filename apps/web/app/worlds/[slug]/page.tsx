import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuestGrid } from "@/components/quest-grid";
import { WorldHubHero } from "@/components/world-hub-hero";
import { loadQuests, loadWorldBySlug, loadWorlds } from "@/lib/content/load";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const worlds = await loadWorlds();
  return worlds.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const world = await loadWorldBySlug(slug);
  if (!world) return { title: "Мир не найден" };
  const ogImages =
    world.heroImageUrl?.startsWith("http") && world.heroImageUrl.length > 8
      ? [{ url: world.heroImageUrl, alt: world.name }]
      : undefined;
  return {
    title: world.name,
    description: world.description,
    openGraph: {
      title: world.name,
      description: world.description,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? "summary_large_image" : "summary",
      title: world.name,
      description: world.description,
      ...(ogImages?.[0]?.url ? { images: [ogImages[0].url] } : {}),
    },
  };
}

export default async function WorldHubPage({ params }: Props) {
  const { slug } = await params;
  const world = await loadWorldBySlug(slug);
  if (!world) notFound();

  const quests = await loadQuests();
  const filtered = quests.filter(
    (q) => q.worldSlug === world.slug && q.activeInCampaign,
  );

  const worlds = await loadWorlds();
  const worldNames = Object.fromEntries(worlds.map((w) => [w.slug, w.name]));

  return (
    <div
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-10"
      data-world={world.themeKey}
    >
      <div className="mb-6">
        <Link
          className="inline-flex items-center gap-2 text-muted-foreground text-sm transition hover:text-foreground"
          href="/catalog"
        >
          <span aria-hidden>←</span> Курсы
        </Link>
      </div>

      <WorldHubHero world={world} />

      <section className="mt-14 space-y-4">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          О мире
        </h2>
        <div className="max-w-3xl whitespace-pre-line text-muted-foreground leading-relaxed">
          {world.pitch}
        </div>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Почему этот мир
        </h2>
        <ul className="max-w-3xl space-y-3 text-muted-foreground leading-relaxed">
          {world.highlights.map((line) => (
            <li key={line} className="flex gap-3">
              <span
                className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_color-mix(in_oklch,var(--primary)_45%,transparent)]"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 space-y-8">
        <div className="border-b border-white/10 pb-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Квесты в этом мире
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Найдено:{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-card/30 px-6 py-16 text-center text-muted-foreground">
            Скоро здесь появятся карточки — черновики уже в репозитории контента.
          </div>
        ) : (
          <QuestGrid quests={filtered} worldNames={worldNames} />
        )}
      </section>

      <section className="mt-14 flex flex-wrap gap-4 border-white/10 border-t pt-10">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-card/40 px-5 py-3 font-medium text-foreground text-sm transition hover:border-white/25 hover:bg-card/60"
          href="/catalog"
        >
          Все курсы BrainMaster
        </Link>
      </section>
    </div>
  );
}
