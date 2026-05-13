import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  /** Дополнительный контент справа или снизу на широких экранах */
  aside?: ReactNode;
};

export function PortalHero({ eyebrow, title, description, aside }: Props) {
  return (
    <section className="relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/90 via-background to-cyan-950/50 p-8 shadow-[0_0_80px_-24px_rgba(139,92,246,0.35)] md:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 22%, rgba(139, 92, 246, 0.35), transparent 42%),
            radial-gradient(circle at 82% 18%, rgba(34, 211, 238, 0.22), transparent 45%),
            radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.18), transparent 55%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
          backgroundSize: "240px 240px",
        }}
      />
      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div className="space-y-5">
          <p className="text-[11px] text-cyan-200/90 uppercase tracking-[0.28em] md:text-xs">
            {eyebrow}
          </p>
          <h1 className="font-heading max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-white via-violet-100 to-cyan-200 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            {description}
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-zinc-500 uppercase tracking-wider">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-zinc-400">
              Инженерные квесты
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-zinc-400">
              Запись · mos.ru или заявка
            </span>
          </div>
        </div>
        {aside ? (
          <div className="relative lg:justify-self-end">{aside}</div>
        ) : null}
      </div>
    </section>
  );
}
