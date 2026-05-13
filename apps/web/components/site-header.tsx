import Link from "next/link";
import Image from "next/image";

import type { World } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = {
  worlds: World[];
};

export function SiteHeader({ worlds }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-xl outline-none ring-offset-background transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="relative flex size-10 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            <Image
              src="/brand/brainmaster-mark.png"
              alt="BrainMaster"
              width={40}
              height={40}
              className="object-contain p-1 transition group-hover:opacity-95"
              priority
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-sm font-semibold tracking-tight text-foreground md:text-base">
              Инженерные квесты
            </span>
            <span className="text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
              BrainMaster · Quest Hub
            </span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1.5 text-sm md:gap-2">
          <Link
            className={cn(
              "rounded-full px-3 py-1.5 text-muted-foreground transition",
              "hover:bg-white/5 hover:text-foreground",
            )}
            href="/"
          >
            Каталог
          </Link>
          {worlds.map((w) => (
            <Link
              key={w.slug}
              className={cn(
                "rounded-full px-3 py-1.5 text-muted-foreground transition",
                "hover:bg-white/5 hover:text-foreground",
              )}
              href={`/worlds/${w.slug}`}
            >
              {w.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
