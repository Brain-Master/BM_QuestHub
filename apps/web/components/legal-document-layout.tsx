import Link from "next/link";

import type { LegalParagraph, LegalSection } from "@/content/legal/personal-data-policy";
import {
  BRAINMASTER_LEGAL_EMAIL_HREF,
  BRAINMASTER_SUPPORT_PHONE_HREF,
} from "@/lib/site-contact";

type OperatorInfo = {
  fullName: string;
  shortName: string;
  inn: string;
  ogrnip: string;
  registrationAddress: string;
  businessAddress: string;
  phone: string;
  email: string;
};

type Props = {
  title: string;
  updatedAt: string;
  operator: OperatorInfo;
  sections: LegalSection[];
};

function LegalParagraphView({ paragraph }: { paragraph: LegalParagraph }) {
  if (typeof paragraph === "string") {
    return <p>{paragraph}</p>;
  }

  return (
    <ul className="grid gap-2 pl-5 text-muted-foreground marker:text-primary">
      {paragraph.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalDocumentLayout({
  title,
  updatedAt,
  operator,
  sections,
}: Props) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="mb-8 rounded-3xl border border-white/10 bg-card/50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md md:p-8">
        <Link
          href="/legal/"
          className="mb-5 inline-flex text-primary text-sm hover:text-primary/80"
        >
          Все документы
        </Link>
        <p className="mb-3 text-muted-foreground text-sm">
          Актуальная редакция: {updatedAt}
        </p>
        <h1 className="max-w-4xl font-heading text-3xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <aside className="grid gap-4 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
            <h2 className="mb-3 font-heading font-semibold text-lg">
              Сведения об операторе
            </h2>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Наименование</dt>
                <dd>{operator.fullName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">ИНН / ОГРНИП</dt>
                <dd>
                  {operator.inn} / {operator.ogrnip}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Адрес регистрации</dt>
                <dd>{operator.registrationAddress}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Адрес деятельности</dt>
                <dd>{operator.businessAddress}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Контакты по ПДн</dt>
                <dd className="grid gap-1">
                  <a href={BRAINMASTER_SUPPORT_PHONE_HREF} className="hover:text-primary">
                    {operator.phone}
                  </a>
                  <a href={BRAINMASTER_LEGAL_EMAIL_HREF} className="hover:text-primary">
                    {operator.email}
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <nav
            aria-label="Оглавление документа"
            className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md"
          >
            <h2 className="mb-3 font-heading font-semibold text-lg">Оглавление</h2>
            <ol className="grid gap-2 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="grid gap-5">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 rounded-2xl border border-white/10 bg-card/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md md:p-7"
            >
              <h2 className="mb-4 font-heading text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <div className="grid gap-3 text-sm leading-relaxed text-zinc-200 md:text-base">
                {section.paragraphs.map((paragraph, index) => (
                  <LegalParagraphView
                    // The policy text is static and ordered; index keeps repeated legal phrases stable.
                    key={`${section.id}-${index}`}
                    paragraph={paragraph}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
