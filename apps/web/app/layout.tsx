import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";

import "./globals.css";

import { ConsentGatedAnalytics } from "@/components/consent-gated-analytics";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { HostScopeBootstrap } from "@/components/host-scope-bootstrap";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { loadWorlds, loadQuestsForSchoolAgenda, loadVenues } from "@/lib/content/load";
import { getSchoolScopes } from "@/lib/offers/agenda";
import { loadSiteConfig } from "@/lib/data/site-config-loader";

const bodySans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const headingSans = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Вселенная Инженерных Квестов · BrainMaster",
    template: "%s · BrainMaster Quest Hub",
  },
  description:
    "Курсы инженерных квестов BrainMaster: миры, смены и запись на программы.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [worlds, siteConfig, quests, venues] = await Promise.all([loadWorlds(), loadSiteConfig(), loadQuestsForSchoolAgenda(), loadVenues()]);
  const scopeByVenue = Object.fromEntries(venues.map(v=>[v.slug,v.schoolScopeSlug??v.slug]));
  const schoolAliases = Object.fromEntries(getSchoolScopes(venues).flatMap(s=>s.routeSlugs.map(slug=>[slug,s.slug])));

  return (
    <html
      lang="ru"
      className={`${bodySans.variable} ${headingSans.variable} dark h-full antialiased`}
      data-world="portal"
      data-scroll-behavior="smooth"
    >
      <body className="bm-page-bg flex min-h-full flex-col bg-background text-foreground">
        <HostScopeBootstrap />
        <ConsentGatedAnalytics />
        <CookieConsentBanner />
        <SiteHeader worlds={worlds} navigation={siteConfig.navigation} baseQuests={quests.filter(q=>q.slug==="shmi")} scopeByVenue={scopeByVenue} schoolAliases={schoolAliases} />
        <div className="flex flex-1 flex-col">{children}</div>
        <ScrollToTopButton />
        <SiteFooter />
      </body>
    </html>
  );
}
