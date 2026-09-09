/** Presentation policy; never infer study year from school, grade or group numbers. */
export function annualProgrammeName(sourceTitle: string) {
  const normalized = sourceTitle.normalize("NFKC");
  const markedYear = normalized.match(/ШМИ\s*[-–]?\s*([1-3])(?!\d)/iu)?.[1];
  const explicitYear = normalized.match(/([1-3])\s*(?:[-–]?\s*(?:й|ый|ой))?\s*год(?:а)?\s+обучения/iu)?.[1];
  const studyYear = markedYear ?? explicitYear ?? null;
  const robotics = /робототехник/iu.test(normalized);
  const grades = robotics ? normalized.match(/([1-9])\s*[-–]\s*([1-9])\s*класс/iu) : null;
  const qualifiers = [
    studyYear ? `${studyYear}-й год` : null,
    robotics ? "робототехника" : null,
    grades ? `${grades[1]}–${grades[2]} классы` : null,
  ].filter(Boolean);
  const suffix = qualifiers.length ? ` · ${qualifiers.join(" · ")}` : "";
  return {
    short: `ШМИ${suffix}`,
    full: `Школа Молодого IT-Инженера${suffix}`,
    studyYear: studyYear === null ? null : Number(studyYear),
  };
}
