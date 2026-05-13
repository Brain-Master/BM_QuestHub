/**
 * Преобразует текстовую метку сложности из контента в шкалу 1–5 для индикатора «ключей» в каталоге.
 */
export function difficultyToLevel(difficulty: string | undefined): number {
  const raw = difficulty?.trim().toLowerCase();
  if (!raw) return 3;

  if (/лёгк|легк|easy/.test(raw)) return 2;
  if (/сред/.test(raw)) return 3;
  if (/сложн|hard/.test(raw)) return 4;
  if (/экстрем|очень|максим/.test(raw)) return 5;
  if (/миним|вводн|прост/.test(raw)) return 1;

  return 3;
}
