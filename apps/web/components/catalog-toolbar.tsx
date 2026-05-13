"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CalendarDays, Globe2, School } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { World } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = {
  worlds: World[];
};

export function CatalogToolbar({ worlds }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { format, world, school } = useMemo(() => {
    return {
      format: searchParams.get("format") ?? "all",
      world: searchParams.get("world") ?? "all",
      school: searchParams.get("school") ?? "",
    };
  }, [searchParams]);

  function pushNext(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "" || v === "all") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/50 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md",
        "md:flex-row md:flex-wrap md:items-end md:justify-between",
      )}
    >
      <label className="grid gap-2 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4 opacity-80" aria-hidden />
          Формат
        </span>
        <Select value={format} onValueChange={(v) => pushNext({ format: v })}>
          <SelectTrigger className="w-full min-w-[220px] border-white/10 bg-black/20 md:w-[240px]">
            <SelectValue placeholder="Формат" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="intensive">Интенсив 5 дней</SelectItem>
            <SelectItem value="year">Годовой трек</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Globe2 className="size-4 opacity-80" aria-hidden />
          Мир
        </span>
        <Select value={world} onValueChange={(v) => pushNext({ world: v })}>
          <SelectTrigger className="w-full min-w-[220px] border-white/10 bg-black/20 md:w-[260px]">
            <SelectValue placeholder="Мир" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все миры</SelectItem>
            {worlds.map((w) => (
              <SelectItem key={w.slug} value={w.slug}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid min-w-0 gap-2 text-sm md:min-w-[280px] md:flex-1">
        <span className="flex items-center gap-2 text-muted-foreground">
          <School className="size-4 opacity-80" aria-hidden />
          Школьный скоуп{" "}
          <span className="text-[11px] text-muted-foreground/70">(?school=)</span>
        </span>
        <input
          key={school || "none"}
          className="h-10 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-foreground shadow-inner outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
          defaultValue={school}
          placeholder="например school-1212"
          name="school"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = (e.target as HTMLInputElement).value.trim();
              pushNext({ school: v });
            }
          }}
        />
      </label>

      <div className="flex flex-wrap gap-2 md:justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="border border-white/5 bg-white/5 hover:bg-white/10"
          onClick={() => {
            const el = document.querySelector(
              "input[name=school]",
            ) as HTMLInputElement | null;
            const v = el?.value.trim() ?? "";
            pushNext({ school: v });
          }}
        >
          Применить школу
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/10 bg-transparent hover:bg-white/5"
          onClick={() => router.push(pathname)}
        >
          Сбросить фильтры
        </Button>
      </div>
    </div>
  );
}
