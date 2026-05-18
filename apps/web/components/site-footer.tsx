import Link from "next/link";

import {
  LEGAL_COOKIES_ANALYTICS_PATH,
  LEGAL_INDEX_PATH,
  LEGAL_OPERATOR_DETAILS_PATH,
  LEGAL_PERSONAL_DATA_PATH,
} from "@/lib/legal-routes";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/25 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_auto_auto] md:items-start">
        <div className="space-y-3">
          <p className="font-heading text-base font-semibold text-foreground">
            BrainMaster Quest Hub
          </p>
          <p className="max-w-xl text-muted-foreground text-sm leading-relaxed">
            Каникулярные интенсивы и инженерные квесты. Цены и даты на сайте —
            ориентир; финальные условия уточняйте при записи и в оферте площадки.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm md:text-right">
          <Link className="text-muted-foreground hover:text-foreground" href="/catalog">
            Курсы
          </Link>
          <Link className="text-muted-foreground hover:text-foreground" href={LEGAL_INDEX_PATH}>
            Документы
          </Link>
        </div>
        <div className="flex flex-col gap-3 text-sm md:text-right">
          <Link
            className="text-muted-foreground hover:text-foreground"
            href={LEGAL_PERSONAL_DATA_PATH}
          >
            Политика обработки ПДн
          </Link>
          <Link
            className="text-muted-foreground hover:text-foreground"
            href={LEGAL_COOKIES_ANALYTICS_PATH}
          >
            Cookies и аналитика
          </Link>
          <Link
            className="text-muted-foreground hover:text-foreground"
            href={LEGAL_OPERATOR_DETAILS_PATH}
          >
            Реквизиты и контакты
          </Link>
          <span className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} BrainMaster
          </span>
        </div>
      </div>
    </footer>
  );
}
