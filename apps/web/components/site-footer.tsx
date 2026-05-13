import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/25 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_auto] md:items-start">
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
          <Link className="text-muted-foreground hover:text-foreground" href="/">
            Каталог
          </Link>
          <span className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} BrainMaster
          </span>
        </div>
      </div>
    </footer>
  );
}
