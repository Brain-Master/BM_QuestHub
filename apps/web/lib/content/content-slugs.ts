import fs from "node:fs";
import path from "node:path";

import { parse as parseYaml } from "yaml";

function webRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "apps", "web", "content"))) {
    return path.join(cwd, "apps", "web");
  }
  if (fs.existsSync(path.join(cwd, "content"))) {
    return cwd;
  }
  throw new Error("Cannot resolve apps/web directory from cwd");
}

function dataRoot(): string {
  return path.join(webRoot(), "data");
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function slugsFromYamlDir(dirName: string): string[] {
  const dir = path.join(webRoot(), "content", dirName);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith(".yaml") || n.endsWith(".yml"))
    .map((n) => {
      const raw = fs.readFileSync(path.join(dir, n), "utf8");
      const data = parseYaml(raw) as { slug?: string };
      return data.slug ?? n.replace(/\.ya?ml$/, "");
    })
    .filter(Boolean);
}

export type ContentSlugSets = {
  venueSlugs: Set<string>;
  questSlugs: Set<string>;
};

/** Slugs for hot-sync validation: S3/local snapshots first, then YAML fallback. */
export function resolveContentSlugSets(): ContentSlugSets {
  const mapPath = path.join(dataRoot(), "v2", "map-snapshot.json");
  const catalogPath = path.join(dataRoot(), "v2", "catalog-snapshot.json");

  const map = readJsonFile<{ venues?: Array<{ slug: string }> }>(mapPath);
  const catalog = readJsonFile<{ courses?: Array<{ slug: string }> }>(
    catalogPath,
  );

  const venueSlugs =
    map?.venues?.map((v) => v.slug) ?? slugsFromYamlDir("venues");
  const questSlugs =
    catalog?.courses?.map((c) => c.slug) ?? slugsFromYamlDir("quests");

  return {
    venueSlugs: new Set(venueSlugs),
    questSlugs: new Set(questSlugs),
  };
}
