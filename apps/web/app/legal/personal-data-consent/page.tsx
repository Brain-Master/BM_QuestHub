import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { personalDataConsent } from "@/content/legal/personal-data-consent";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных",
  description:
    "Согласие на обработку персональных данных для заявок и предварительной записи BrainMaster Quest Hub.",
};

export default function PersonalDataConsentPage() {
  return (
    <LegalDocumentLayout
      title={personalDataConsent.title}
      updatedAt={personalDataConsent.updatedAt}
      operator={personalDataConsent.operator}
      sections={personalDataConsent.sections}
    />
  );
}
