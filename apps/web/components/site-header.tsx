"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import {
  parsePreferredSchool,
  PREFERRED_SCHOOL_STORAGE_KEY,
} from "@/lib/preferred-school";
import type { World } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = {
  worlds: World[];
};

export function SiteHeader({ worlds }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [preferredSchoolSlug, setPreferredSchoolSlug] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLElement | null>(null);
  const swipeStartX = React.useRef<number | null>(null);
  const pathSchoolSlug = pathname.match(/^\/sites\/([^/]+)/)?.[1] ?? null;
  const effectiveSchoolSlug = pathSchoolSlug ?? preferredSchoolSlug;
  const navItems = [
    {
      href: effectiveSchoolSlug ? `/sites/${effectiveSchoolSlug}/agenda` : "/agenda",
      label: "Расписание",
    },
    {
      href: effectiveSchoolSlug ? `/sites/${effectiveSchoolSlug}/catalog` : "/catalog",
      label: "Каталог",
    },
    { href: "/sites", label: "Площадки" },
    ...worlds.map((world) => ({
      href: `/worlds/${world.slug}`,
      label: world.name,
    })),
  ];
  const linkClassName = cn(
    "rounded-full px-3 py-1.5 text-muted-foreground transition",
    "hover:bg-white/5 hover:text-foreground",
  );
  const mobileLinkClassName = cn(
    "flex min-h-12 items-center rounded-2xl px-4 text-base font-medium text-foreground transition",
    "hover:bg-white/[0.08] active:bg-white/10",
  );

  React.useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    function onResize() {
      if (window.matchMedia("(min-width: 640px)").matches) setMenuOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  React.useEffect(() => {
    const syncPreferredSchool = () => {
      const preferred = parsePreferredSchool(
        localStorage.getItem(PREFERRED_SCHOOL_STORAGE_KEY),
      );
      setPreferredSchoolSlug(preferred?.slug ?? null);
    };

    syncPreferredSchool();
    window.addEventListener("storage", syncPreferredSchool);
    window.addEventListener("focus", syncPreferredSchool);

    return () => {
      window.removeEventListener("storage", syncPreferredSchool);
      window.removeEventListener("focus", syncPreferredSchool);
    };
  }, [pathname]);

  function handleSwipeEnd(event: React.PointerEvent<HTMLElement>) {
    if (swipeStartX.current === null) return;
    const swipeDistance = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (swipeDistance > 60) setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="group flex max-w-full items-center gap-3 rounded-xl outline-none ring-offset-background transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] text-foreground shadow-[0_10px_28px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.12] active:translate-y-px active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:hidden"
          aria-label="Открыть меню"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          <span className="sr-only">Открыть меню</span>
          <span className="relative flex size-5 items-center justify-center">
            <Menu className="size-5" aria-hidden />
          </span>
        </button>

        <div
          className={cn(
            "fixed top-0 right-0 z-50 h-dvh w-screen overflow-hidden bg-black/55 backdrop-blur-sm transition-opacity duration-300 sm:hidden",
            menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!menuOpen}
          onPointerDown={() => setMenuOpen(false)}
        >
          <aside
            ref={menuRef}
            id="site-mobile-menu"
            className="absolute top-0 right-0 flex h-dvh w-[min(20rem,86vw)] touch-pan-y flex-col border-white/10 border-l bg-background/[0.96] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl transition-transform duration-300 ease-out"
            style={{ transform: menuOpen ? "translateX(0)" : "translateX(100%)" }}
            onPointerDown={(event) => {
              event.stopPropagation();
              swipeStartX.current = event.clientX;
            }}
            onPointerUp={handleSwipeEnd}
            onPointerCancel={() => {
              swipeStartX.current = null;
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-white/10 border-b pb-4">
              <div>
                <p className="font-heading font-semibold text-foreground">Меню</p>
                <p className="text-muted-foreground text-xs">Выберите раздел</p>
              </div>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-foreground transition hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Закрыть меню"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav className="mt-4 grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className={mobileLinkClassName}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="mt-auto pt-6 text-muted-foreground text-xs">
              Свайпните меню вправо или нажмите вне панели, чтобы закрыть.
            </p>
          </aside>
        </div>

        <nav className="hidden items-center justify-end gap-1.5 text-sm sm:flex sm:flex-wrap md:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={linkClassName}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
