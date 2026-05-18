import type { Metadata } from "next";

import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { operatorDetails } from "@/content/legal/operator-details";

export const metadata: Metadata = {
  title: "Реквизиты и контакты",
  description: "Реквизиты и контакты оператора BrainMaster Quest Hub.",
};

export default function OperatorDetailsPage() {
  return (
    <LegalDocumentLayout
      title={operatorDetails.title}
      updatedAt={operatorDetails.updatedAt}
      operator={operatorDetails.operator}
      sections={operatorDetails.sections}
    />
  );
}
