import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { marketingConsent } from "@/content/legal/marketing-consent";

export const metadata: Metadata = {
  title: "Согласие на информационные сообщения",
  description:
    "Согласие на получение информационных и рекламных сообщений BrainMaster.",
};

export default function MarketingConsentPage() {
  return (
    <LegalDocumentLayout
      title={marketingConsent.title}
      updatedAt={marketingConsent.updatedAt}
      operator={marketingConsent.operator}
      sections={marketingConsent.sections}
    />
  );
}
