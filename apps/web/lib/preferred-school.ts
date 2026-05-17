export type PreferredSchool = {
  slug: string;
  name: string;
};

export const PREFERRED_SCHOOL_STORAGE_KEY = "bm.questhub.preferredSchool.v1";

export function parsePreferredSchool(raw: string | null): PreferredSchool | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<PreferredSchool>;
    if (!data.slug || !data.name) return null;
    return {
      slug: String(data.slug),
      name: String(data.name),
    };
  } catch {
    return null;
  }
}
