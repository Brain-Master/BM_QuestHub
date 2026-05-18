import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { cookiesAnalyticsPolicy } from "@/content/legal/cookies-analytics-policy";

export const metadata: Metadata = {
  title: "Политика cookies и аналитики",
  description:
    "Политика использования cookies, localStorage и Яндекс.Метрики на сайте BrainMaster Quest Hub.",
};

export default function CookiesAnalyticsPolicyPage() {
  return (
    <LegalDocumentLayout
      title={cookiesAnalyticsPolicy.title}
      updatedAt={cookiesAnalyticsPolicy.updatedAt}
      operator={cookiesAnalyticsPolicy.operator}
      sections={cookiesAnalyticsPolicy.sections}
    />
  );
}
