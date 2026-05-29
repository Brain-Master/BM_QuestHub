import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Users, UsersRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { CityCard } from "@/lib/sites/city-card";
import { pluralizeRu } from "@/lib/i18n/pluralize-ru";
import { cn } from "@/lib/utils";

type Props = {
  cities: CityCard[];
};

function CityStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-primary/80" aria-hidden />
      <span className="text-foreground">
        <span className="font-semibold tabular-nums">{value}</span>{" "}
        <span className="text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function CityCardView({ city }: { city: CityCard }) {
  const showImage = Boolean(city.imageUrl?.startsWith("/"));

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/55 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        {showImage && city.imageUrl ? (
          <Image
            src={city.imageUrl}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              city.gradient,
            )}
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.2),transparent_45%),linear-gradient(to_top,rgba(0,0,0,0.55),transparent_55%)]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {city.label}
        </h3>

        <ul className="grid gap-2.5">
          <li>
            <CityStat
              icon={BookOpen}
              value={city.courseCount}
              label={pluralizeRu(city.courseCount, ["курс", "курса", "курсов"])}
            />
          </li>
          <li>
            <CityStat
              icon={Building2}
              value={city.siteCount}
              label={pluralizeRu(city.siteCount, ["площадка", "площадки", "площадок"])}
            />
          </li>
          <li>
            <CityStat
              icon={UsersRound}
              value={city.groupCount}
              label={pluralizeRu(city.groupCount, ["группа", "группы", "групп"])}
            />
          </li>
          <li>
            <CityStat
              icon={Users}
              value={city.participantCount}
              label={pluralizeRu(city.participantCount, [
                "участник",
                "участника",
                "участников",
              ])}
            />
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 border-white/10 border-t pt-4">
          <p className="text-muted-foreground text-xs">
            {city.siteCount}{" "}
            {pluralizeRu(city.siteCount, ["площадка", "площадки", "площадок"])}
          </p>
          <Link
            href={`/sites?city=${encodeURIComponent(city.slug)}`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-1.5 shadow-[0_0_20px_rgba(8,145,178,0.25)]",
            )}
          >
            Перейти
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CitySelectionGrid({ cities }: Props) {
  return (
    <section className="space-y-8">
      <div className="border-b border-white/10 pb-5">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Россия
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          Выберите город, чтобы увидеть площадки BrainMaster, курсы и открытые группы
          без лишнего шума из других регионов.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cities.map((city) => (
          <CityCardView key={city.slug} city={city} />
        ))}
      </div>
    </section>
  );
}
