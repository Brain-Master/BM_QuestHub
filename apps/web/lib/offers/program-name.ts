/** Заголовок программы: вселенная (h1) + курс (h2), разделитель «:». */

export function joinProgramName(h1: string | undefined, h2: string | undefined): string {
  const a = (h1 ?? "").trim();
  const b = (h2 ?? "").trim();
  if (a && b) return `${a}: ${b}`;
  return a || b;
}

export function splitProgramName(full: string): {
  program_name_h1: string;
  program_name_h2: string;
} {
  const s = full.trim();
  const idx = s.indexOf(":");
  if (idx === -1) {
    return { program_name_h1: "", program_name_h2: s };
  }
  return {
    program_name_h1: s.slice(0, idx).trim(),
    program_name_h2: s.slice(idx + 1).trim(),
  };
}
