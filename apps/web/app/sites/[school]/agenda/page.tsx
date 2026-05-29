import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActivityPhotoGallery } from "@/components/activity-photo-gallery";
import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { LiveAgenda } from "@/components/live-agenda";
import { RememberSchoolOnVisit } from "@/components/remember-school-on-visit";
import { SchoolAgendaHero } from "@/components/school-agenda-hero";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import {
  loadQuestsForSchoolAgenda,
  loadScheduleSnapshotGeneratedAt,
  loadVenues,
  loadWorlds,
} from "@/lib/content/load";
import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import { getSchoolScopes, resolveSchoolScope } from "@/lib/offers/agenda";
import {
  absolutePublicUrl,
  buildOpenGraph,
  buildTwitterCard,
  pageAlternates,
} from "@/lib/seo/metadata";
import {
  resolveSchoolCampusLocations,
  resolveSchoolLandingMedia,
  resolveSchoolLocationSummary,
} from "@/lib/school-landing-media";
import { buildSiteHref } from "@/lib/sites/site-route";

type Props = {
  params: Promise<{ school: string }>;
};

function canonicalSchoolPath(schoolSlug: string): string {
  return buildSiteHref(schoolSlug).replace(/\/$/, "") + "/agenda/";
}

export async function generateStaticParams() {
  const venues = await loadVenues();
  return getSchoolScopes(venues).flatMap((school) =>
    school.routeSlugs.map((routeSlug) => ({ school: routeSlug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school: schoolSlug } = await params;
  const venues = await loadVenues();
  const school = resolveSchoolScope(venues, schoolSlug);
  if (!school) return { title: "Площадка не найдена" };

  const location = resolveSchoolLocationSummary(school.venues);
  const media = resolveSchoolLandingMedia(school.slug);
  const fullName = school.venues[0]?.name ?? school.name;
  const title = `Летние смены · ${fullName} · BrainMaster`;
  const description = location
    ? `Расписание инженерных квестов BrainMaster · ${school.name} · ${location}. Запись на mos.ru и предварительные заявки.`
    : `Расписание инженерных квестов BrainMaster для площадки ${school.name}.`;

  const ogMediaPath = media.videoPosterUrl ?? media.activityGallery[0]?.url;
  const ogResolved = resolvePublicMediaUrl(ogMediaPath);
  const ogImageUrl =
    ogResolved?.startsWith("http") ? ogResolved : absolutePublicUrl(ogResolved);

  const pathname = canonicalSchoolPath(school.slug);

  return {
    title,
    description,
    alternates: pageAlternates(pathname),
    openGraph: buildOpenGraph({
      title,
      description,
      pathname,
      ...(ogImageUrl
        ? { images: [{ url: ogImageUrl, alt: `BrainMaster · ${school.name}` }] }
        : {}),
    }),
    twitter: buildTwitterCard({
      title,
      description,
      imageUrl: ogImageUrl,
    }),
  };
}

export default async function SchoolAgendaPage({ params }: Props) {
  const { school: schoolSlug } = await params;
  const [quests, venues, worlds, initialSnapshotGeneratedAt] = await Promise.all([
    loadQuestsForSchoolAgenda(),
    loadVenues(),
    loadWorlds(),
    loadScheduleSnapshotGeneratedAt(),
  ]);
  const school = resolveSchoolScope(venues, schoolSlug);
  if (!school) notFound();

  const media = resolveSchoolLandingMedia(school.slug);
  const campusLocations = resolveSchoolCampusLocations(school.venues);
  const schoolFullName = school.venues[0]?.name ?? school.name;
  const videoPosterUrl =
    media.videoPosterUrl ??
    media.activityGallery[0]?.url;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <RememberSchoolOnVisit slug={school.slug} name={school.name} />

      <SchoolAgendaHero
        schoolShortName={school.name}
        schoolFullName={schoolFullName}
        campusLocations={campusLocations}
        videoFileUrl={media.videoFileUrl}
        videoPosterUrl={videoPosterUrl}
      />

      <LiveAgenda
        baseQuests={quests}
        venues={venues}
        worlds={worlds}
        initialSnapshotGeneratedAt={initialSnapshotGeneratedAt}
        schoolSlug={school.slug}
        schoolName={school.name}
        allAgendaHref="/agenda"
        sitesHref="/sites"
        hideScheduleTitle
        hideCommunityPanel
      />

      <ActivityPhotoGallery
        photos={media.activityGallery}
        schoolName={school.name}
        className="mt-10"
      />

      <CommunityConnectPanel
        variant="card"
        className="mt-10"
        {...communityConnectCopy.schoolAgendaGallery}
      />
    </main>
  );
}
