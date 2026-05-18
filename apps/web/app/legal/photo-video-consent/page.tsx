import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { photoVideoConsent } from "@/content/legal/photo-video-consent";

export const metadata: Metadata = {
  title: "Согласие на фото- и видеосъемку",
  description:
    "Согласие на фото- и видеосъемку и использование изображений участников BrainMaster.",
};

export default function PhotoVideoConsentPage() {
  return (
    <LegalDocumentLayout
      title={photoVideoConsent.title}
      updatedAt={photoVideoConsent.updatedAt}
      operator={photoVideoConsent.operator}
      sections={photoVideoConsent.sections}
    />
  );
}
