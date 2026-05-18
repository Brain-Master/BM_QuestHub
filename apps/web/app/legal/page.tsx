import type { Metadata } from "next";
import Link from "next/link";

import { personalDataPolicy } from "@/content/legal/personal-data-policy";
import { LEGAL_PERSONAL_DATA_PATH } from "@/lib/legal-routes";

export const metadata: Metadata = {
  title: "Документы",
  description: "Служебные документы BrainMaster Quest Hub.",
};

export default function LegalIndexPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <section className="mb-8 rounded-3xl border border-white/10 bg-card/50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md md:p-8">
        <p className="mb-3 text-muted-foreground text-sm">BrainMaster Quest Hub</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-5xl">
          Документы
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Здесь собраны служебные документы, которые относятся к заявкам,
          предварительной записи и обработке персональных данных.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card/45 p-5 backdrop-blur-md md:p-7">
        <Link
          href={LEGAL_PERSONAL_DATA_PATH}
          className="group block rounded-xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-primary/50"
        >
          <p className="font-heading text-xl font-semibold group-hover:text-primary">
            {personalDataPolicy.shortTitle}
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            Актуальная редакция: {personalDataPolicy.updatedAt}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-200">
            Порядок и условия обработки персональных данных при заполнении
            заявок и предварительных заявок на программы BrainMaster.
          </p>
        </Link>
      </section>
    </main>
  );
}
