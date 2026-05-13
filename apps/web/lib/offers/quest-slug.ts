/**
 * Сопоставление названия программы из таблицы с `quest.slug`.
 * Предпочтительно явная колонка `quest_slug` в листе; иначе эвристика по подстрокам.
 */

const FRAGMENTS: { needle: string; slug: string }[] = [
  { needle: "киберритм", slug: "cyber-rhythm" },
  { needle: "кибер ритм", slug: "cyber-rhythm" },
  { needle: "тайна древних инженеров", slug: "minecraft-taina-drevnih-inzhenerov" },
  { needle: "пробуждение страж", slug: "minecraft-probuzhdenie-strazhey" },
  {
    needle: "мастерская гидравлических монстров",
    slug: "mekhvarium-masterskaya-gidravlicheskih-monstrov",
  },
  {
    needle: "лаборатория кинетических монстров",
    slug: "mekhvarium-laboratoriya-kineticheskih-monstrov",
  },
  {
    needle: "лаборатория инженерных монстров",
    slug: "mekhvarium-laboratoriya-kineticheskih-monstrov",
  },
];

export function resolveQuestSlug(
  programName: string,
  explicitQuestSlug?: string | null,
): string | null {
  const explicit = explicitQuestSlug?.trim();
  if (explicit) return explicit;

  const n = programName.trim().toLowerCase();
  for (const { needle, slug } of FRAGMENTS) {
    if (n.includes(needle)) return slug;
  }
  return null;
}
