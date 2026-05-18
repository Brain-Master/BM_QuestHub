import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { personalDataPolicy } from "@/content/legal/personal-data-policy";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Политика обработки персональных данных BrainMaster Quest Hub для заявок и предварительной записи.",
};

export default function PersonalDataPolicyPage() {
  return (
    <LegalDocumentLayout
      title={personalDataPolicy.title}
      updatedAt={personalDataPolicy.updatedAt}
      operator={personalDataPolicy.operator}
      sections={personalDataPolicy.sections}
    />
  );
}
