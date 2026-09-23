/** Exact address review, 2026-09-08. OSM building centres, not verified entrances.
 * Data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright
 * Existing two venue identities/coordinates are retained unchanged by the compiler.
 */
export const annualLocations = [
  { sourceId: "LOC-011", slug: "school-937-marshala-zakharova-25", schoolScopeSlug: "school-937", address: "ул. Маршала Захарова, 25", latitude: 55.619040, longitude: 37.699562, source: "https://yandex.com/maps/org/shkola_937_imeni_geroya_rossiyskoy_federatsii_a_v_perova_zdaniye_1/1349921670/", existing: true },
  { sourceId: "LOC-001", slug: "school-17-vvedenskogo-28s1", schoolScopeSlug: "school-17", address: "ул. Введенского, 28, стр. 1", latitude: 55.6367936, longitude: 37.5315551, source: "https://www.openstreetmap.org/way/336271264", existing: false },
  { sourceId: "LOC-002", slug: "school-875-vernadskogo-99k2", schoolScopeSlug: "school-875", address: "проспект Вернадского, 99, корп. 2", latitude: 55.6654818, longitude: 37.4913015, source: "https://www.openstreetmap.org/way/35960350", existing: false },
  { sourceId: "LOC-003", slug: "school-1212-vilnyusskaya-14", schoolScopeSlug: "school-1212", address: "Вильнюсская ул., 14", latitude: 55.5980474, longitude: 37.5173409, source: "https://www.openstreetmap.org/relation/365815", existing: false },
  { sourceId: "LOC-004", slug: "school-1212-golubinskaya-21k3", schoolScopeSlug: "school-1212", address: "Голубинская ул., 21, корп. 3", latitude: 55.6016376, longitude: 37.5270587, source: "https://www.openstreetmap.org/way/45942198", existing: false },
  { sourceId: "LOC-005", slug: "school-1383-verkhnie-likhobory", schoolScopeSlug: "school-1383", address: "Дубнинская ул., 7", latitude: 55.8578245, longitude: 37.5664733, source: "https://www.openstreetmap.org/way/426230315", existing: true },
  { sourceId: "LOC-006", slug: "school-1517-narodnoe-opolchenie", schoolScopeSlug: "school-1517", address: "ул. Маршала Тухачевского, 58, корп. 2", latitude: 55.7857335, longitude: 37.4572437, source: "https://www.openstreetmap.org/way/27546292", existing: true },
  { sourceId: "LOC-007", slug: "school-2044-dmitrovskoe-169b", schoolScopeSlug: "school-2044", address: "Дмитровское шоссе, 169Б", latitude: 55.9321515, longitude: 37.5405089, source: "https://www.openstreetmap.org/relation/15552197", existing: false },
  { sourceId: "LOC-008", slug: "school-2044-dmitrovskoe-165e-k8", schoolScopeSlug: "school-2044", address: "Дмитровское шоссе, 165Е, корп. 8", latitude: 55.9267027, longitude: 37.5423375, source: "https://www.openstreetmap.org/way/70952813", existing: false },
  { sourceId: "LOC-009", slug: "school-2103-yasenevo", schoolScopeSlug: "school-2103", address: "Голубинская ул., 13, корп. 2", latitude: 55.602950, longitude: 37.517538, source: "https://yandex.com/maps/org/shkola_2103_shkolnoye_otdeleniye_korpus_4/1021683301/", existing: true },
  { sourceId: "LOC-010", slug: "school-2103-golubinskaya-5k4", schoolScopeSlug: "school-2103", address: "Голубинская ул., 5, корп. 4", latitude: 55.604812, longitude: 37.517989, source: "https://yandex.com/maps/org/shkola_2103_shkolnoye_otdeleniye_korpus_3/1379658584/", existing: false },
  { sourceId: "LOC-012", slug: "school-37-michurinsky-28", schoolScopeSlug: "school-37", address: "Мичуринский проспект, 28", latitude: 55.702891, longitude: 37.502471, source: "https://yandex.com/maps/213/moscow/house/michurinskiy_prospekt_28/Z04YcwdiTUIGQFtvfXtxc3RqZQ==/", existing: false },
] as const;

export const annualWorld = {
  slug: "brainmaster-engineering", name: "Инженерное образование BrainMaster", themeKey: "cyber-rhythm",
  description: "Годовые направления: ШМИ, Инженерная IT-Академия, проекты и Олимпиадная Лига.",
  tagline: "От первых опытов к собственным инженерным проектам",
  pitch: "Электроника, конструирование и программирование через практику. Программу и уровень конкретной группы уточняйте перед записью.",
  highlights: ["Работа руками", "Поддержка наставника", "Создание проектов"],
  heroImageUrl: "/editorial/year-courses/academy-1280.webp",
};

/** Public address is verified independently of admitting pending937 groups.
 * Do not manufacture offers or infer teacher/age from this campus record.
 */
export const reviewedStandaloneVenues = [
  {slug:"school-937-marshala-zakharova-25",schoolScopeSlug:"school-937"},
] as const;
