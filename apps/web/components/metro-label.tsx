import { cn } from "@/lib/utils";

export const METRO_LINES_BY_STATION: Record<
  string,
  { number: string; name: string; color: string }
> = {
  Беляево: {
    number: "6",
    name: "Калужско-Рижская линия",
    color: "#F07E24",
  },
  "Верхние Лихоборы": {
    number: "10",
    name: "Люблинско-Дмитровская линия",
    color: "#BED12C",
  },
  Орехово: {
    number: "2",
    name: "Замоскворецкая линия",
    color: "#4FB04F",
  },
  Ясенево: {
    number: "6",
    name: "Калужско-Рижская линия",
    color: "#F07E24",
  },
  "Юго-Западная": {
    number: "1",
    name: "Сокольническая линия",
    color: "#E42313",
  },
  "Народное Ополчение": {
    number: "11",
    name: "Большая кольцевая линия",
    color: "#82C0C0",
  },
};

export function MetroLabel({ metro, className }: { metro?: string; className?: string }) {
  if (!metro || metro === "—") return null;

  const line = METRO_LINES_BY_STATION[metro];

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {line ? (
        <span
          aria-label={line.name}
          title={line.name}
          className={cn(
            "inline-grid size-4 shrink-0 place-items-center rounded-full font-semibold text-[9px] text-white leading-none tabular-nums",
            line.number.length > 1 && "text-[8px]",
          )}
          style={{ backgroundColor: line.color }}
        >
          {line.number}
        </span>
      ) : null}
      <span className="min-w-0">{metro}</span>
    </span>
  );
}
