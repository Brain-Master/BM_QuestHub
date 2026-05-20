import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { fetchSheetValuesGrid } from "@/lib/google/fetch-sheet-grid";
import { coldSheetConfig } from "@/lib/google/sheet-env";
import type { Quest, Venue, World } from "@/lib/schemas";

import {
  COURSE_REQUIRED_HEADERS,
  isSkippableDataRow,
  parseCourseRow,
  parseVenueRow,
  parseWorldRow,
  rowObject,
  validateHeaderRow,
  VENUE_HEADERS,
  WORLD_REQUIRED_HEADERS,
} from "./cold-sheet-contract";

function sha256Json(value: unknown): string {
  const raw = JSON.stringify(value);
  return `sha256:${crypto.createHash("sha256").update(raw, "utf8").digest("hex")}`;
}

function webDataRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "apps", "web", "data"))) {
    return path.join(cwd, "apps", "web", "data");
  }
  return path.join(cwd, "data");
}

function parseGrid<T>(
  grid: string[][],
  requiredHeaders: readonly string[],
  parseRow: (
    obj: Record<string, string>,
    rowIndex: number,
  ) => { success: true; data: T } | { success: false; error: string },
  label: string,
): { items: T[]; errors: string[] } {
  if (grid.length === 0) {
    return { items: [], errors: [`${label}: пустой лист`] };
  }

  const headerCheck = validateHeaderRow(
    grid[0].map((c) => String(c)),
    requiredHeaders,
  );
  if (!headerCheck.ok) {
    return { items: [], errors: [`${label}: ${headerCheck.message}`] };
  }

  const headers = headerCheck.normalized;
  const items: T[] = [];
  const errors: string[] = [];

  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r].map((c) => String(c));
    if (isSkippableDataRow(cells, headers)) continue;
    const obj = rowObject(headers, cells);
    const result = parseRow(obj, r + 1);
    if (result.success) {
      items.push(result.data);
    } else {
      errors.push(`Строка ${r + 1}: ${result.error}`);
    }
  }

  return { items, errors };
}

export type ColdSnapshotBundle = {
  catalog: {
    version: 2;
    generatedAt: string;
    source: string;
    integrity: { contentHash: string };
    worlds: World[];
    courses: Quest[];
  };
  map: {
    version: 2;
    generatedAt: string;
    source: string;
    integrity: { contentHash: string };
    venues: Venue[];
  };
  details: Array<{ slug: string; course: Quest }>;
};

export type SyncColdResult = {
  ok: true;
  worlds: number;
  venues: number;
  courses: number;
  generatedAt: string;
  bundle: ColdSnapshotBundle;
};

export type SyncColdOptions = {
  onAlert?: (message: string) => Promise<void>;
};

export async function syncColdContentFromGoogleSheet(
  options: SyncColdOptions = {},
): Promise<SyncColdResult> {
  const alert = options.onAlert ?? (async () => {});
  const { spreadsheetId, ranges } = coldSheetConfig();
  const generatedAt = new Date().toISOString();
  const source = "google_sheet_cold";

  const [worldsGrid, venuesGrid, coursesGrid] = await Promise.all([
    fetchSheetValuesGrid({ spreadsheetId, range: ranges.worlds }),
    fetchSheetValuesGrid({ spreadsheetId, range: ranges.venues }),
    fetchSheetValuesGrid({ spreadsheetId, range: ranges.courses }),
  ]);

  const worldsParsed = parseGrid(worldsGrid, WORLD_REQUIRED_HEADERS, (obj) => {
    const r = parseWorldRow(obj);
    if (!r.success) {
      return {
        success: false,
        error: r.error.issues.map((i) => i.message).join("; "),
      };
    }
    return { success: true, data: r.data };
  }, "Миры");

  const venuesParsed = parseGrid(venuesGrid, VENUE_HEADERS, (obj) => {
    const r = parseVenueRow(obj);
    if (!r.success) {
      return {
        success: false,
        error: r.error.issues.map((i) => i.message).join("; "),
      };
    }
    return { success: true, data: r.data };
  }, "Площадки");

  const coursesParsed = parseGrid(coursesGrid, COURSE_REQUIRED_HEADERS, (obj) => {
    const r = parseCourseRow(obj);
    if (!r.success) {
      return {
        success: false,
        error: r.error.issues.map((i) => i.message).join("; "),
      };
    }
    return { success: true, data: r.data };
  }, "Курсы");

  const allErrors = [
    ...worldsParsed.errors,
    ...venuesParsed.errors,
    ...coursesParsed.errors,
  ];

  if (allErrors.length > 0) {
    const sample = allErrors.slice(0, 20).join("\n");
    await alert(`[QuestHub sync-cold] Ошибки (${allErrors.length})\n${sample}`);
    throw new Error(
      `Ошибки в cold-таблице (${allErrors.length}):\n${allErrors.slice(0, 5).join("\n")}`,
    );
  }

  if (
    worldsParsed.items.length === 0 ||
    venuesParsed.items.length === 0 ||
    coursesParsed.items.length === 0
  ) {
    throw new Error(
      "Cold-таблица: нужны хотя бы одна строка в Миры, Площадки и Курсы",
    );
  }

  const worldSlugs = new Set(worldsParsed.items.map((w) => w.slug));
  for (const c of coursesParsed.items) {
    if (!worldSlugs.has(c.worldSlug)) {
      throw new Error(
        `Курс ${c.slug}: world_slug ${c.worldSlug} не найден на вкладке Миры`,
      );
    }
  }

  const catalogBody = {
    worlds: worldsParsed.items,
    courses: coursesParsed.items,
  };
  const mapBody = { venues: venuesParsed.items };

  const bundle: ColdSnapshotBundle = {
    catalog: {
      version: 2,
      generatedAt,
      source,
      integrity: { contentHash: sha256Json(catalogBody) },
      ...catalogBody,
    },
    map: {
      version: 2,
      generatedAt,
      source,
      integrity: { contentHash: sha256Json(mapBody) },
      ...mapBody,
    },
    details: coursesParsed.items.map((course) => ({ slug: course.slug, course })),
  };

  return {
    ok: true,
    worlds: worldsParsed.items.length,
    venues: venuesParsed.items.length,
    courses: coursesParsed.items.length,
    generatedAt,
    bundle,
  };
}

export function writeColdSnapshotsToDisk(bundle: ColdSnapshotBundle): string {
  const dataRoot = webDataRoot();
  const v2 = path.join(dataRoot, "v2");
  const detailDir = path.join(v2, "detail");

  fs.mkdirSync(detailDir, { recursive: true });

  const write = (filePath: string, payload: unknown) => {
    fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  };

  write(path.join(v2, "catalog-snapshot.json"), bundle.catalog);
  write(path.join(v2, "map-snapshot.json"), bundle.map);

  for (const { slug, course } of bundle.details) {
    write(path.join(detailDir, `${slug}.json`), {
      version: 2,
      generatedAt: bundle.catalog.generatedAt,
      source: bundle.catalog.source,
      integrity: {
        contentHash: sha256Json({ course }),
      },
      course,
    });
  }

  const manifestPath = path.join(v2, "site-manifest.json");
  let manifest: Record<string, unknown> = {
    version: 2,
    generatedAt: bundle.catalog.generatedAt,
    source: bundle.catalog.source,
    snapshots: {},
  };
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<
      string,
      unknown
    >;
    manifest.generatedAt = bundle.catalog.generatedAt;
    manifest.source = bundle.catalog.source;
  }

  const snapshots = (manifest.snapshots ?? {}) as Record<string, unknown>;
  snapshots.site = snapshots.site ?? { path: "data/v2/site-config.json" };
  snapshots.catalog = {
    path: "data/v2/catalog-snapshot.json",
    contentHash: bundle.catalog.integrity.contentHash,
  };
  snapshots.map = {
    path: "data/v2/map-snapshot.json",
    contentHash: bundle.map.integrity.contentHash,
  };
  snapshots.schedule = snapshots.schedule ?? {
    path: "data/offers-snapshot.json",
  };
  manifest.snapshots = snapshots;

  write(manifestPath, manifest);
  return dataRoot;
}
