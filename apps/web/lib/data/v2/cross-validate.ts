import type { CourseV2, EventV2, UniverseV2, VenueV2 } from "@/lib/data/v2/entities";
import type { SiteSnapshotV2 } from "@/lib/data/v2/site-snapshot";

export type CrossValidationIssue = {
  code: string;
  message: string;
};

export function validateSiteSnapshotRelations(
  snapshot: Pick<
    SiteSnapshotV2,
    "universes" | "courses" | "venues" | "events"
  >,
): CrossValidationIssue[] {
  const issues: CrossValidationIssue[] = [];
  const universeIds = new Set(snapshot.universes.map((u) => u.id));
  const courseIds = new Set(snapshot.courses.map((c) => c.id));
  const venueIds = new Set(snapshot.venues.map((v) => v.id));

  for (const course of snapshot.courses) {
    if (!universeIds.has(course.universeId)) {
      issues.push({
        code: "course.universeId",
        message: `Course ${course.id} references missing universe ${course.universeId}`,
      });
    }
  }

  for (const event of snapshot.events) {
    if (!courseIds.has(event.relations.courseId)) {
      issues.push({
        code: "event.courseId",
        message: `Event ${event.id} references missing course ${event.relations.courseId}`,
      });
    }
    if (!venueIds.has(event.relations.venueId)) {
      issues.push({
        code: "event.venueId",
        message: `Event ${event.id} references missing venue ${event.relations.venueId}`,
      });
    }
    if (event.schedule.endDate < event.schedule.startDate) {
      issues.push({
        code: "event.schedule",
        message: `Event ${event.id} has endDate before startDate`,
      });
    }
  }

  return issues;
}

export function assertValidSiteSnapshotRelations(
  snapshot: Pick<
    SiteSnapshotV2,
    "universes" | "courses" | "venues" | "events"
  >,
): void {
  const issues = validateSiteSnapshotRelations(snapshot);
  if (issues.length === 0) return;
  throw new Error(
    `Site snapshot V2 cross-validation failed: ${issues.map((i) => i.message).join("; ")}`,
  );
}

export function courseIdFromSlug(courses: CourseV2[], slug: string): string | undefined {
  return courses.find((c) => c.slug === slug)?.id ?? slug;
}

export function venueIdFromSlug(venues: VenueV2[], slug: string): string | undefined {
  return venues.find((v) => v.slug === slug)?.id ?? slug;
}

export function universeIdFromSlug(
  universes: UniverseV2[],
  slug: string,
): string | undefined {
  return universes.find((u) => u.slug === slug)?.id ?? slug;
}

export function eventsForCourse(events: EventV2[], courseId: string): EventV2[] {
  return events.filter((e) => e.relations.courseId === courseId);
}
