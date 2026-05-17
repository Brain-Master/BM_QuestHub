export const ALL_PROGRAM_FILTER_VALUE = "all";

const SERIES_PREFIX = "series:";
const QUEST_PREFIX = "quest:";

export type ProgramFilterSource = {
  slug: string;
  title: string;
  worldSlug: string;
  worldName?: string | null;
  programLabel?: string | null;
};

export type ProgramFilterWorld = {
  slug: string;
  name: string;
};

export type ProgramFilterOption = {
  value: string;
  label: string;
  slug: string;
};

export type ProgramFilterGroup = {
  value: string;
  label: string;
  slug: string;
  programs: ProgramFilterOption[];
};

export type ParsedProgramFilter =
  | { kind: "all" }
  | { kind: "series"; slug: string }
  | { kind: "quest"; slug: string };

type MutableProgramFilterGroup = ProgramFilterGroup & {
  programSlugs: Set<string>;
};

export function makeSeriesProgramFilterValue(slug: string): string {
  return `${SERIES_PREFIX}${slug}`;
}

export function makeQuestProgramFilterValue(slug: string): string {
  return `${QUEST_PREFIX}${slug}`;
}

export function parseProgramFilterValue(value?: string | null): ParsedProgramFilter {
  if (!value || value === ALL_PROGRAM_FILTER_VALUE) return { kind: "all" };
  if (value.startsWith(SERIES_PREFIX)) {
    return { kind: "series", slug: value.slice(SERIES_PREFIX.length) };
  }
  if (value.startsWith(QUEST_PREFIX)) {
    return { kind: "quest", slug: value.slice(QUEST_PREFIX.length) };
  }
  return { kind: "all" };
}

export function buildProgramFilterGroups(
  sources: ProgramFilterSource[],
  worlds: ProgramFilterWorld[] = [],
): ProgramFilterGroup[] {
  const worldNames = new Map(worlds.map((world) => [world.slug, world.name]));
  const worldOrder = new Map(worlds.map((world, index) => [world.slug, index]));
  const groups = new Map<string, MutableProgramFilterGroup>();

  for (const source of sources) {
    const label =
      worldNames.get(source.worldSlug) ?? source.worldName ?? source.worldSlug;
    let group = groups.get(source.worldSlug);

    if (!group) {
      group = {
        value: makeSeriesProgramFilterValue(source.worldSlug),
        label,
        slug: source.worldSlug,
        programs: [],
        programSlugs: new Set<string>(),
      };
      groups.set(source.worldSlug, group);
    }

    if (group.programSlugs.has(source.slug)) continue;
    group.programSlugs.add(source.slug);
    group.programs.push({
      value: makeQuestProgramFilterValue(source.slug),
      label: source.programLabel?.trim() || source.title,
      slug: source.slug,
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      value: group.value,
      label: group.label,
      slug: group.slug,
      programs: group.programs.sort((a, b) => a.label.localeCompare(b.label, "ru")),
    }))
    .sort((a, b) => {
      const aOrder = worldOrder.get(a.slug);
      const bOrder = worldOrder.get(b.slug);
      if (typeof aOrder === "number" && typeof bOrder === "number") {
        return aOrder - bOrder;
      }
      if (typeof aOrder === "number") return -1;
      if (typeof bOrder === "number") return 1;
      return a.label.localeCompare(b.label, "ru");
    });
}
