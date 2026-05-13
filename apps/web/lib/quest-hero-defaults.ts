import type { Quest } from "@/lib/schemas";

export function durationLabelOrDefault(quest: Quest): string {
  const d = quest.durationLabel?.trim();
  if (d) return d;
  return quest.format === "intensive"
    ? "5 дней · интенсив (часы смены — по выбранной площадке)"
    : "По программе годового трека";
}

export function priceHintOrDefault(quest: Quest): string {
  const p = quest.priceHint?.trim();
  if (p) return p;
  return "Стоимость и условия — после выбора площадки и смены";
}
