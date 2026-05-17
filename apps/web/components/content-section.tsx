import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  id?: string;
};

export function ContentSection({ title, children, id }: Props) {
  return (
    <section
      id={id}
      className="mb-8 scroll-mt-28 rounded-2xl border border-white/5 bg-card/45 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-6 md:mb-10 md:p-8"
    >
      <h2 className="font-heading mb-4 flex items-center gap-3 text-xl font-semibold tracking-tight">
        <span
          className="inline-block size-2 shrink-0 rounded-full bg-primary shadow-[0_0_12px_color-mix(in_oklch,var(--primary)_45%,transparent)]"
          aria-hidden
        />
        {title}
      </h2>
      <div className="max-w-none text-sm leading-relaxed text-zinc-200 sm:text-base">
        {children}
      </div>
    </section>
  );
}
