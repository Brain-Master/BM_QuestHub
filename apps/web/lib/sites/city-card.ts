export const DEFAULT_CITY = "moscow";

type SiteForCityAggregation = {
  city: string;
  courseSlugs: string[];
  shiftCount: number;
  studentCount: number;
};

export type CityMeta = {
  slug: string;
  label: string;
  imageUrl?: string;
  sortOrder?: number;
  gradient: string;
};

export type CityCard = {
  slug: string;
  label: string;
  imageUrl?: string;
  gradient: string;
  siteCount: number;
  courseCount: number;
  groupCount: number;
  participantCount: number;
  activityScore: number;
};

export type CityOption = {
  value: string;
  label: string;
};

export const CITY_META: Record<string, CityMeta> = {
  moscow: {
    slug: "moscow",
    label: "Москва",
    sortOrder: 0,
    gradient: "from-violet-700/90 via-indigo-700/85 to-cyan-700/80",
  },
  krasnodar: {
    slug: "krasnodar",
    label: "Краснодар",
    sortOrder: 1,
    gradient: "from-emerald-700/90 via-teal-700/85 to-cyan-700/80",
  },
  rostov: {
    slug: "rostov",
    label: "Ростов-на-Дону",
    sortOrder: 2,
    gradient: "from-orange-700/90 via-rose-700/85 to-red-700/80",
  },
  ufa: {
    slug: "ufa",
    label: "Уфа",
    sortOrder: 3,
    gradient: "from-blue-700/90 via-indigo-700/85 to-violet-700/80",
  },
};

const DEFAULT_GRADIENT = "from-violet-700/90 via-indigo-700/85 to-cyan-700/80";

export function getCityLabel(slug: string): string {
  return CITY_META[slug]?.label ?? slug;
}

export function getCityGradient(slug: string): string {
  return CITY_META[slug]?.gradient ?? DEFAULT_GRADIENT;
}

export function isCityActive(city: CityCard): boolean {
  return city.siteCount > 0 && (city.courseCount > 0 || city.groupCount > 0);
}

export function buildCityCards(sites: SiteForCityAggregation[]): CityCard[] {
  const byCity = new Map<string, SiteForCityAggregation[]>();

  for (const site of sites) {
    const list = byCity.get(site.city) ?? [];
    list.push(site);
    byCity.set(site.city, list);
  }

  const cards: CityCard[] = [];

  for (const [slug, citySites] of byCity) {
    const meta = CITY_META[slug];
    const courseSlugs = new Set<string>();
    let groupCount = 0;
    let participantCount = 0;

    for (const site of citySites) {
      for (const courseSlug of site.courseSlugs) {
        courseSlugs.add(courseSlug);
      }
      groupCount += site.shiftCount;
      participantCount += site.studentCount;
    }

    const siteCount = citySites.length;
    const courseCount = courseSlugs.size;

    cards.push({
      slug,
      label: meta?.label ?? getCityLabel(slug),
      imageUrl: meta?.imageUrl,
      gradient: meta?.gradient ?? DEFAULT_GRADIENT,
      siteCount,
      courseCount,
      groupCount,
      participantCount,
      activityScore: siteCount + courseCount + groupCount,
    });
  }

  return cards
    .filter(isCityActive)
    .sort((a, b) => {
      const orderA = CITY_META[a.slug]?.sortOrder ?? 99;
      const orderB = CITY_META[b.slug]?.sortOrder ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.label.localeCompare(b.label, "ru");
    });
}

export function toCityOptions(cities: CityCard[]): CityOption[] {
  return cities.map((city) => ({ value: city.slug, label: city.label }));
}
