import type { SnapshotsBundle } from "./snapshot-boundary";

const MAX_BOUNDED_STRING = 160;
const MAX_SOURCE_STATUS = 64;

export type SnapshotCollectionStatus =
  | "ready"
  | "empty"
  | "unavailable"
  | "malformed";

export type CourseReadStatus = "active" | "inactive" | "unknown";

export type VenueReadStatus = "listed" | "hidden" | "unknown";

export type OfferAvailabilityStatus =
  | "archived"
  | "full"
  | "available"
  | "unknown";

export type WorldSummary = {
  readonly id: string;
  readonly title: string;
  readonly courseCount: number;
};

export type CourseSummary = {
  readonly id: string;
  readonly title: string;
  readonly worldId: string;
  readonly status: CourseReadStatus;
  readonly offerCount: number;
};

export type VenueSummary = {
  readonly id: string;
  readonly title: string;
  readonly type: string | null;
  readonly address: string | null;
  readonly city: string | null;
  readonly status: VenueReadStatus;
  readonly offerCount: number;
};

export type OfferSummary = {
  readonly id: string;
  readonly courseId: string;
  readonly venueId: string;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly sourceStatus: string | null;
  readonly availability: OfferAvailabilityStatus;
  readonly capacity: number | null;
  readonly enrolled: number | null;
  readonly available: number | null;
};

export type SnapshotEntityCounts = {
  readonly worlds: number;
  readonly courses: number;
  readonly venues: number;
  readonly offers: number;
};

export type SnapshotCollectionStatuses = {
  readonly catalog: SnapshotCollectionStatus;
  readonly map: SnapshotCollectionStatus;
  readonly site: SnapshotCollectionStatus;
  readonly manifest: SnapshotCollectionStatus;
  readonly offers: SnapshotCollectionStatus;
};

export type SnapshotStatusCounts = {
  readonly courses: Readonly<Record<CourseReadStatus, number>>;
  readonly venues: Readonly<Record<VenueReadStatus, number>>;
  readonly offers: Readonly<Record<OfferAvailabilityStatus, number>>;
};

export type SnapshotReadModel = {
  readonly counts: SnapshotEntityCounts;
  readonly collectionStatuses: SnapshotCollectionStatuses;
  readonly statusCounts: SnapshotStatusCounts;
  readonly worlds: readonly WorldSummary[];
  readonly courses: readonly CourseSummary[];
  readonly venues: readonly VenueSummary[];
  readonly offers: readonly OfferSummary[];
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function boundString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

function asNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

function asPositiveInteger(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

function courseStatus(value: unknown): CourseReadStatus {
  if (value === true) return "active";
  if (value === false) return "inactive";
  return "unknown";
}

function venueStatus(value: unknown): VenueReadStatus {
  if (value === true) return "listed";
  if (value === false) return "hidden";
  return "unknown";
}

function offerAvailability(
  isArchived: boolean,
  capacity: number | null,
  enrolled: number | null,
): OfferAvailabilityStatus {
  if (isArchived) return "archived";
  if (capacity !== null && enrolled !== null && enrolled >= capacity) {
    return "full";
  }
  if (capacity !== null) return "available";
  return "unknown";
}

function resolveSourceStatus(row: Record<string, unknown>): string | null {
  if (hasOwn(row, "scheduleCard") && isPlainRecord(row.scheduleCard)) {
    const fromCard = boundString(row.scheduleCard.status, MAX_SOURCE_STATUS);
    if (fromCard !== null) return fromCard;
  }
  return boundString(row.sheetStatus, MAX_SOURCE_STATUS);
}

function readOfferRow(
  row: unknown,
  courseId: string,
): OfferSummary | null {
  if (!isPlainRecord(row)) return null;
  const id = boundString(row.id, MAX_BOUNDED_STRING);
  const venueId = boundString(row.venueSlug, MAX_BOUNDED_STRING);
  if (id === null || venueId === null) return null;

  const capacity = asPositiveInteger(row.maxCapacity);
  const enrolled = asNonNegativeInteger(row.enrolled);
  const available =
    capacity !== null && enrolled !== null
      ? Math.max(capacity - enrolled, 0)
      : null;

  let isArchived = false;
  if (hasOwn(row, "scheduleCard") && isPlainRecord(row.scheduleCard)) {
    isArchived = row.scheduleCard.isArchived === true;
  }

  return {
    id,
    courseId,
    venueId,
    startDate: boundString(row.startDate, MAX_BOUNDED_STRING),
    endDate: boundString(row.endDate, MAX_BOUNDED_STRING),
    sourceStatus: resolveSourceStatus(row),
    availability: offerAvailability(isArchived, capacity, enrolled),
    capacity,
    enrolled,
    available,
  };
}

function countByKey(
  items: readonly { readonly key: string }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.key, (counts.get(item.key) ?? 0) + 1);
  }
  return counts;
}

function readCatalogArrays(bundle: SnapshotsBundle): {
  worlds: unknown[] | null;
  courses: unknown[] | null;
} {
  const worlds = hasOwn(bundle.catalog, "worlds") ? bundle.catalog.worlds : undefined;
  const courses = hasOwn(bundle.catalog, "courses")
    ? bundle.catalog.courses
    : undefined;
  return {
    worlds: Array.isArray(worlds) ? worlds : null,
    courses: Array.isArray(courses) ? courses : null,
  };
}

function buildOfferSummaries(bundle: SnapshotsBundle): OfferSummary[] {
  if (bundle.offers === null) return [];
  if (!hasOwn(bundle.offers, "offersByQuest")) return [];
  const offersByQuest = bundle.offers.offersByQuest;
  if (!isPlainRecord(offersByQuest)) return [];

  const summaries: OfferSummary[] = [];
  for (const courseKey of Object.keys(offersByQuest)) {
    const courseId = boundString(courseKey, MAX_BOUNDED_STRING);
    if (courseId === null) continue;
    const group = offersByQuest[courseKey];
    if (!Array.isArray(group)) continue;
    for (const row of group) {
      const summary = readOfferRow(row, courseId);
      if (summary !== null) summaries.push(summary);
    }
  }
  return summaries;
}

function buildCourseSummaries(
  bundle: SnapshotsBundle,
  offers: readonly OfferSummary[],
): CourseSummary[] {
  const { courses } = readCatalogArrays(bundle);
  if (courses === null) return [];

  const offerCounts = countByKey(
    offers.map((offer) => ({ key: offer.courseId })),
  );
  const summaries: CourseSummary[] = [];

  for (const row of courses) {
    if (!isPlainRecord(row)) continue;
    const id = boundString(row.slug, MAX_BOUNDED_STRING);
    const title = boundString(row.title, MAX_BOUNDED_STRING);
    const worldId = boundString(row.worldSlug, MAX_BOUNDED_STRING);
    if (id === null || title === null || worldId === null) continue;
    summaries.push({
      id,
      title,
      worldId,
      status: courseStatus(row.activeInCampaign),
      offerCount: offerCounts.get(id) ?? 0,
    });
  }
  return summaries;
}

function buildWorldSummaries(
  bundle: SnapshotsBundle,
  courses: readonly CourseSummary[],
): WorldSummary[] {
  const { worlds } = readCatalogArrays(bundle);
  if (worlds === null) return [];

  const courseCounts = countByKey(
    courses.map((course) => ({ key: course.worldId })),
  );
  const summaries: WorldSummary[] = [];

  for (const row of worlds) {
    if (!isPlainRecord(row)) continue;
    const id = boundString(row.slug, MAX_BOUNDED_STRING);
    const title = boundString(row.name, MAX_BOUNDED_STRING);
    if (id === null || title === null) continue;
    summaries.push({
      id,
      title,
      courseCount: courseCounts.get(id) ?? 0,
    });
  }
  return summaries;
}

function buildVenueSummaries(
  bundle: SnapshotsBundle,
  offers: readonly OfferSummary[],
): VenueSummary[] {
  const venuesValue = hasOwn(bundle.map, "venues") ? bundle.map.venues : undefined;
  if (!Array.isArray(venuesValue)) return [];

  const offerCounts = countByKey(
    offers.map((offer) => ({ key: offer.venueId })),
  );
  const summaries: VenueSummary[] = [];

  for (const row of venuesValue) {
    if (!isPlainRecord(row)) continue;
    const id = boundString(row.slug, MAX_BOUNDED_STRING);
    const name = boundString(row.name, MAX_BOUNDED_STRING);
    if (id === null || name === null) continue;
    const displayName = boundString(row.displayName, MAX_BOUNDED_STRING);
    summaries.push({
      id,
      title: displayName ?? name,
      type: boundString(row.type, MAX_BOUNDED_STRING),
      address: boundString(row.address, MAX_BOUNDED_STRING),
      city: boundString(row.city, MAX_BOUNDED_STRING),
      status: venueStatus(row.listedOnSites),
      offerCount: offerCounts.get(id) ?? 0,
    });
  }
  return summaries;
}

function catalogCollectionStatus(
  bundle: SnapshotsBundle,
  worlds: readonly WorldSummary[],
  courses: readonly CourseSummary[],
): SnapshotCollectionStatus {
  const arrays = readCatalogArrays(bundle);
  if (arrays.worlds === null || arrays.courses === null) return "malformed";
  if (arrays.worlds.length === 0 && arrays.courses.length === 0) return "empty";
  if (worlds.length > 0 || courses.length > 0) return "ready";
  return "malformed";
}

function mapCollectionStatus(
  bundle: SnapshotsBundle,
  venues: readonly VenueSummary[],
): SnapshotCollectionStatus {
  const venuesValue = hasOwn(bundle.map, "venues") ? bundle.map.venues : undefined;
  if (!Array.isArray(venuesValue)) return "malformed";
  if (venuesValue.length === 0) return "empty";
  if (venues.length > 0) return "ready";
  return "malformed";
}

function siteCollectionStatus(bundle: SnapshotsBundle): SnapshotCollectionStatus {
  return Object.keys(bundle.site).length === 0 ? "empty" : "ready";
}

function manifestCollectionStatus(
  bundle: SnapshotsBundle,
): SnapshotCollectionStatus {
  if (bundle.manifest === null) return "unavailable";
  return Object.keys(bundle.manifest).length === 0 ? "empty" : "ready";
}

function offersCollectionStatus(
  bundle: SnapshotsBundle,
  offers: readonly OfferSummary[],
): SnapshotCollectionStatus {
  if (bundle.offers === null) return "unavailable";
  if (!hasOwn(bundle.offers, "offersByQuest")) return "malformed";
  const offersByQuest = bundle.offers.offersByQuest;
  if (!isPlainRecord(offersByQuest)) return "malformed";

  const keys = Object.keys(offersByQuest);
  if (keys.length === 0) return "empty";

  let allEmptyArrays = true;
  for (const key of keys) {
    const group = offersByQuest[key];
    if (!Array.isArray(group) || group.length > 0) {
      allEmptyArrays = false;
      break;
    }
  }
  if (allEmptyArrays) return "empty";
  if (offers.length > 0) return "ready";
  return "malformed";
}

function buildCollectionStatuses(
  bundle: SnapshotsBundle,
  worlds: readonly WorldSummary[],
  courses: readonly CourseSummary[],
  venues: readonly VenueSummary[],
  offers: readonly OfferSummary[],
): SnapshotCollectionStatuses {
  return {
    catalog: catalogCollectionStatus(bundle, worlds, courses),
    map: mapCollectionStatus(bundle, venues),
    site: siteCollectionStatus(bundle),
    manifest: manifestCollectionStatus(bundle),
    offers: offersCollectionStatus(bundle, offers),
  };
}

function buildStatusCounts(
  courses: readonly CourseSummary[],
  venues: readonly VenueSummary[],
  offers: readonly OfferSummary[],
): SnapshotStatusCounts {
  const courseCounts: Record<CourseReadStatus, number> = {
    active: 0,
    inactive: 0,
    unknown: 0,
  };
  const venueCounts: Record<VenueReadStatus, number> = {
    listed: 0,
    hidden: 0,
    unknown: 0,
  };
  const offerCounts: Record<OfferAvailabilityStatus, number> = {
    archived: 0,
    full: 0,
    available: 0,
    unknown: 0,
  };

  for (const course of courses) courseCounts[course.status] += 1;
  for (const venue of venues) venueCounts[venue.status] += 1;
  for (const offer of offers) offerCounts[offer.availability] += 1;

  return {
    courses: courseCounts,
    venues: venueCounts,
    offers: offerCounts,
  };
}

function buildReadModel(bundle: SnapshotsBundle): SnapshotReadModel {
  const offers = buildOfferSummaries(bundle);
  const courses = buildCourseSummaries(bundle, offers);
  const worlds = buildWorldSummaries(bundle, courses);
  const venues = buildVenueSummaries(bundle, offers);

  return {
    counts: {
      worlds: worlds.length,
      courses: courses.length,
      venues: venues.length,
      offers: offers.length,
    },
    collectionStatuses: buildCollectionStatuses(
      bundle,
      worlds,
      courses,
      venues,
      offers,
    ),
    statusCounts: buildStatusCounts(courses, venues, offers),
    worlds,
    courses,
    venues,
    offers,
  };
}

export function selectWorldSummaries(
  bundle: SnapshotsBundle,
): readonly WorldSummary[] {
  const offers = buildOfferSummaries(bundle);
  const courses = buildCourseSummaries(bundle, offers);
  return buildWorldSummaries(bundle, courses);
}

export function selectCourseSummaries(
  bundle: SnapshotsBundle,
): readonly CourseSummary[] {
  return buildCourseSummaries(bundle, buildOfferSummaries(bundle));
}

export function selectVenueSummaries(
  bundle: SnapshotsBundle,
): readonly VenueSummary[] {
  return buildVenueSummaries(bundle, buildOfferSummaries(bundle));
}

export function selectOfferSummaries(
  bundle: SnapshotsBundle,
): readonly OfferSummary[] {
  return buildOfferSummaries(bundle);
}

export function selectEntityCounts(bundle: SnapshotsBundle): SnapshotEntityCounts {
  const model = buildReadModel(bundle);
  return model.counts;
}

export function selectCollectionStatuses(
  bundle: SnapshotsBundle,
): SnapshotCollectionStatuses {
  return buildReadModel(bundle).collectionStatuses;
}

export function selectStatusCounts(
  bundle: SnapshotsBundle,
): SnapshotStatusCounts {
  return buildReadModel(bundle).statusCounts;
}

export function selectSnapshotReadModel(
  bundle: SnapshotsBundle,
): SnapshotReadModel {
  return buildReadModel(bundle);
}
