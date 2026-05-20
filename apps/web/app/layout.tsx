import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";

import "./globals.css";

import { AnalyticsVisitScope } from "@/components/analytics-visit-scope";
import { HostScopeBootstrap } from "@/components/host-scope-bootstrap";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { YandexMetrika } from "@/components/yandex-metrika";
import { loadWorlds } from "@/lib/content/load";
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
  const [worlds, siteConfig] = await Promise.all([loadWorlds(), loadSiteConfig()]);

  return (
    <html
      lang="ru"
      className={`${bodySans.variable} ${headingSans.variable} dark h-full antialiased`}
      data-world="portal"
      data-scroll-behavior="smooth"
    >
      <body className="bm-page-bg flex min-h-full flex-col bg-background text-foreground">
        <HostScopeBootstrap />
        <AnalyticsVisitScope />
        <YandexMetrika />
        <SiteHeader worlds={worlds} navigation={siteConfig.navigation} />
        <div className="flex flex-1 flex-col">{children}</div>
        <ScrollToTopButton />
        <SiteFooter />
      </body>
    </html>
  );
}
