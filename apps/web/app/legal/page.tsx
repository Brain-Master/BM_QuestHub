import type { Metadata } from "next";
import Link from "next/link";

import { cookiesAnalyticsPolicy } from "@/content/legal/cookies-analytics-policy";
import { marketingConsent } from "@/content/legal/marketing-consent";
import { operatorDetails } from "@/content/legal/operator-details";
import { personalDataConsent } from "@/content/legal/personal-data-consent";
import { personalDataPolicy } from "@/content/legal/personal-data-policy";
import { photoVideoConsent } from "@/content/legal/photo-video-consent";
import { termsOfUse } from "@/content/legal/terms-of-use";
import {
  LEGAL_COOKIES_ANALYTICS_PATH,
  LEGAL_MARKETING_CONSENT_PATH,
  LEGAL_OPERATOR_DETAILS_PATH,
  LEGAL_PERSONAL_DATA_CONSENT_PATH,
  LEGAL_PERSONAL_DATA_PATH,
  LEGAL_PHOTO_VIDEO_CONSENT_PATH,
  LEGAL_TERMS_PATH,
} from "@/lib/legal-routes";

export const metadata: Metadata = {
  title: "Документы",
  description: "Служебные документы BrainMaster Quest Hub.",
};

const currentDocuments = [
  {
    href: LEGAL_PERSONAL_DATA_CONSENT_PATH,
    title: personalDataConsent.shortTitle,
    updatedAt: personalDataConsent.updatedAt,
    description:
      "Отдельное согласие родителя или законного представителя на обработку данных при отправке заявки.",
  },
  {
    href: LEGAL_PERSONAL_DATA_PATH,
    title: personalDataPolicy.shortTitle,
    updatedAt: personalDataPolicy.updatedAt,
    description:
      "Порядок и условия обработки персональных данных при заполнении заявок и предварительных заявок.",
  },
  {
    href: LEGAL_COOKIES_ANALYTICS_PATH,
    title: cookiesAnalyticsPolicy.shortTitle,
    updatedAt: cookiesAnalyticsPolicy.updatedAt,
    description:
      "Cookies, localStorage, Яндекс.Метрика, вебвизор и аналитика пользовательского пути.",
  },
  {
    href: LEGAL_TERMS_PATH,
    title: termsOfUse.shortTitle,
    updatedAt: termsOfUse.updatedAt,
    description:
      "Правила использования сайта, информационный статус материалов и переходы на внешние сервисы.",
  },
  {
    href: LEGAL_OPERATOR_DETAILS_PATH,
    title: operatorDetails.shortTitle,
    updatedAt: operatorDetails.updatedAt,
    description: "Реквизиты ИП, адреса, телефон и электронная почта для обращений.",
  },
];

const separateConsents = [
  {
    href: LEGAL_MARKETING_CONSENT_PATH,
    title: marketingConsent.shortTitle,
    updatedAt: marketingConsent.updatedAt,
    description:
      "Заготовка для отдельного согласия на информационные и рекламные сообщения.",
  },
  {
    href: LEGAL_PHOTO_VIDEO_CONSENT_PATH,
    title: photoVideoConsent.shortTitle,
    updatedAt: photoVideoConsent.updatedAt,
    description:
      "Заготовка для отдельного согласия на съемку и использование изображений участников.",
  },
];

const futureDocuments = [
  "Публичная оферта на оказание услуг",
  "Правила возврата, отмены и переноса занятий",
  "Правила участия / памятка родителю",
  "Сведения об образовательной деятельности / лицензии",
];

function DocumentCard({
  href,
  title,
  updatedAt,
  description,
}: {
  href: string;
  title: string;
  updatedAt: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-primary/50"
    >
      <p className="font-heading text-xl font-semibold group-hover:text-primary">
        {title}
      </p>
      <p className="mt-2 text-muted-foreground text-sm">
        Актуальная редакция: {updatedAt}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-zinc-200">{description}</p>
    </Link>
  );
}

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
        <h2 className="mb-4 font-heading text-2xl font-semibold">
          Действующие документы
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {currentDocuments.map((document) => (
            <DocumentCard key={document.href} {...document} />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-card/45 p-5 backdrop-blur-md md:p-7">
        <h2 className="mb-3 font-heading text-2xl font-semibold">
          Отдельные согласия
        </h2>
        <p className="mb-4 max-w-3xl text-muted-foreground text-sm leading-relaxed">
          Эти документы опубликованы как самостоятельные формы согласия. Текущая
          заявка на сайте не означает согласия на рассылки или фото- и видеосъемку
          без отдельного подтверждения.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {separateConsents.map((document) => (
            <DocumentCard key={document.href} {...document} />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 backdrop-blur-md md:p-7">
        <h2 className="mb-3 font-heading text-2xl font-semibold">
          Будущие документы
        </h2>
        <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
          Этот блок будет нужен, если BrainMaster начнет принимать оплату или
          оформлять договор напрямую на сайте. Сейчас договорные документы не
          смешиваются с текущими согласиями и политиками.
        </p>
        <ul className="mt-4 grid gap-2 pl-5 text-sm text-zinc-200 marker:text-primary">
          {futureDocuments.map((document) => (
            <li key={document}>{document}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
