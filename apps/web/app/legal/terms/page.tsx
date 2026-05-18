import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { termsOfUse } from "@/content/legal/terms-of-use";

export const metadata: Metadata = {
  title: "Пользовательское соглашение",
  description:
    "Условия использования сайта BrainMaster Quest Hub, заявок и переходов на внешние сервисы.",
};

export default function TermsOfUsePage() {
  return (
    <LegalDocumentLayout
      title={termsOfUse.title}
      updatedAt={termsOfUse.updatedAt}
      operator={termsOfUse.operator}
      sections={termsOfUse.sections}
    />
  );
}
