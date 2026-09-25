import type { MetadataRoute } from "next";
import { loadQuests, loadVenues } from "@/lib/content/load";
import { getSchoolScopes } from "@/lib/offers/agenda";
import { yearPrograms } from "@/content/year-programs";
import { buildCanonicalPath } from "@/lib/seo/metadata";
export const dynamic = "force-static";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [quests, venues] = await Promise.all([loadQuests(), loadVenues()]);
  const paths = ["/", "/agenda/", "/catalog/", "/sites/", "/year-courses/",
    ...yearPrograms.map(programme => `/year-courses/${programme.id}/`),
    ...quests.map(quest => `/quests/${quest.slug}/`),
    ...getSchoolScopes(venues).flatMap(school => [`/sites/${school.slug}/`, `/sites/${school.slug}/agenda/`, `/sites/${school.slug}/catalog/`]),
  ];
  return [...new Set(paths)].map(path => ({ url: buildCanonicalPath(path) }));
}
