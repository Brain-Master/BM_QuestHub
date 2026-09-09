/** Local-only, idempotent annual overlay. Never reads credentials or publishes. */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { annualLocations, annualWorld } from "../apps/web/content/year-integration";
import { getSchoolProfile, reviewedCampusProfile } from "../apps/web/content/school-profiles";
import { reviewedStudyYear, reviewedGroupCodes, reviewedTeacher } from "../apps/web/content/annual-group-overrides";
import { annualMosRefreshSchema } from "../apps/web/lib/offers/annual-schedule";
import { yearPrograms } from "../apps/web/content/year-programs";
import { projectAnnualWorkspace, yearScheduleSchema } from "../apps/web/lib/year-schedule";
import { annualProgrammeName } from "../apps/web/lib/offers/annual-programme-name";
import { questSchema, venueSchema, venueOfferSchema, worldSchema } from "../apps/web/lib/schemas";
import { catalogSnapshotSchema, mapSnapshotSchema, courseDetailSnapshotSchema } from "../apps/web/lib/data/v2/catalog-snapshot";
import { siteManifestV2Schema } from "../apps/web/lib/data/v2/site-snapshot";
import { parseOffersSnapshot } from "../apps/web/lib/offers/snapshot-parse";
import { assertNoPrivateFields } from "../apps/web/lib/data/v2/private-field-denylist";
import { annualOverlayTimestamp, selectAnnualOutputs } from "./annual-publish-tier.mjs";
import { restorePublishedAnnual } from "./lib/mos-annual-published.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.join(root, "apps/web");
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(web, p), "utf8"));
const encode = (v: unknown) => JSON.stringify(v, null, 2) + "\n";
const hash = (v: unknown) => "sha256:" + crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
const source = yearScheduleSchema.parse(read("content/year-schedule.generated.json"));
const refreshPath = path.join(web, "content/annual-mos-refresh.generated.json");
let refresh = fs.existsSync(refreshPath) ? annualMosRefreshSchema.parse(JSON.parse(fs.readFileSync(refreshPath, "utf8"))) : null;
if (refresh && refresh.sourceSha256 !== source.sourceSha256) throw Error("Annual refresh/source revision mismatch");
const catalog = read("data/v2/catalog-snapshot.json");
const map = read("data/v2/map-snapshot.json");
const offers = read("data/offers-snapshot.json");
const manifest = read("data/v2/site-manifest.json");
// Validate at the input boundary, retaining original raw records to avoid incidental normalization.
catalogSnapshotSchema.parse(catalog); mapSnapshotSchema.parse(map); siteManifestV2Schema.parse(manifest);
// Explicit local recovery only: restore missing context without replacing a snapshot.
const contextBackup=process.argv.find(arg=>arg.startsWith('--restore-missing-venue-context='))?.split('=').slice(1).join('=');
if(contextBackup){
  if(!path.isAbsolute(contextBackup)||!process.argv.includes('--tier=cold'))throw Error('Context recovery requires absolute backup path and cold tier');
  const baseline=mapSnapshotSchema.parse(JSON.parse(fs.readFileSync(contextBackup,'utf8')));
  assertNoPrivateFields(baseline);
  let restored=0;
  for(const venue of map.venues){
    const school=venue.schoolScopeSlug??venue.slug;
    if(!getSchoolProfile(school))continue;
    const previous=baseline.venues.find(v=>v.slug===venue.slug&&(v.schoolScopeSlug??v.slug)===school);
    const overlay=reviewedCampusProfile(school,venue.slug);
    if(!previous)continue;
    for(const key of ['metro','district'] as const){
      if(venue[key]===undefined&&!(key in overlay)&&previous[key]!==undefined){venue[key]=previous[key];restored++;}
    }
  }
  console.log(JSON.stringify({restoredMissingVenueContextFields:restored}));
}
if (parseOffersSnapshot(offers).source === "invalid_file") throw Error("Invalid base offers snapshot");
if (refresh) {
  const venueByGroup=Object.fromEntries(source.groups.map(g=>{
    const location=annualLocations.find(l=>l.sourceId===g.locationId);
    if(!location)throw Error(`Unmapped group address ${g.id}`);
    return [g.id,location.slug];
  }));
  const studyYearByGroup=Object.fromEntries(source.groups.map(g=>[g.id,
    reviewedStudyYear(annualLocations.find(l=>l.sourceId===g.locationId)!.schoolScopeSlug) ?? annualProgrammeName(refresh?.groups[g.id]?.title ?? g.title).studyYear]));
  // This boundary is necessary even for direct local/manual compilation.
  // Unknown compatible rows remain byte-identical in retainedShmi below.
  try {
    refresh=annualMosRefreshSchema.parse(restorePublishedAnnual(refresh,Object.values(offers.offersByQuest).flat(),{asOf:source.asOf,venueByGroup,studyYearByGroup,preserveUnknown:true}));
  } catch(e) {
    if (e instanceof Error && e.message==='ANNUAL_PUBLISHED_REVISION_MISMATCH') throw Error('Newer or conflicting annual source revision / Mixed annual source revisions');
    throw e;
  }
} else if ((offers.offersByQuest.shmi ?? []).some((o:{annual?:{refreshedAt?:string}})=>o.annual?.refreshedAt)) throw Error('Missing live registry for refreshed annual source');
const generatedAt = Object.values(refresh?.groups ?? {}).reduce((latest,g)=>g.refreshedAt > latest ? g.refreshedAt : latest, `${source.asOf}T00:00:00.000Z`);
const meta = { version: 2 as const, generatedAt, source: "annual-csv-integration" };
const originalOffers = structuredClone(offers.offersByQuest);
const originals = { worlds: structuredClone(catalog.worlds), courses: structuredClone(catalog.courses), venues: structuredClone(map.venues) };
const media: Record<string, string> = { shmi: "shmi-robot", "it-academy": "academy", projects: "project", "olympiad-league": "olympiad" };
const courses = yearPrograms.map(p => questSchema.omit({ offers: true }).parse({
  slug: p.id, worldSlug: annualWorld.slug, title: p.title, tagline: p.tagline,
  ageLabel: "Уровень и возраст уточняйте для выбранной группы", format: "year", skills: [...p.skills], activeInCampaign: true,
  heroImageUrl: `/editorial/year-courses/${media[p.id]}-1280.webp`, catalogImageUrl: `/editorial/year-courses/${media[p.id]}-640.webp`,
  durationLabel: "Годовая программа", priceHint: "Условия указаны в карточке группы",
  story: p.description, skillsParent: p.outcome, loot: p.outcome,
  approach: p.stages.map(s => `${s.title}: ${s.text}`).join("\n\n"),
}));
function replaceOwned<T extends { slug: string }>(current: T[], additions: T[]) {
  const owned = new Set(additions.map(x => x.slug));
  return [...current.filter(x => !owned.has(x.slug)), ...additions];
}
const venues = annualLocations.filter(l => !l.existing).map(l => {
  const row = source.locations.find(s => s.id === l.sourceId);
  if (!row) throw Error(`Missing reviewed location ${l.sourceId}`);
  return venueSchema.parse({ slug: l.slug, name: row.school, type: "school", schoolScopeSlug: l.schoolScopeSlug,
    address: l.address, metro: row.metro ?? undefined, city: "moscow", latitude: l.latitude, longitude: l.longitude, listedOnSites: true,
    logoUrl: "/icon.png", directions: [], photos: [], entranceNote: "Расположение здания отмечено на карте. Вход и кабинет уточните перед занятием.",
    ...reviewedCampusProfile(l.schoolScopeSlug, l.slug) });
});
for (const l of annualLocations.filter(l => l.existing)) {
  if (!map.venues.some((v: { slug: string; schoolScopeSlug?: string }) => v.slug === l.slug && v.schoolScopeSlug === l.schoolScopeSlug)) throw Error(`Existing venue mismatch ${l.slug}`);
}
// Reviewed profiles own only explicitly returned presentation/location fields.
// Existing IDs, routing, colours and unrelated source facts are retained.
for (const original of map.venues) {
  const school = original.schoolScopeSlug ?? original.slug;
  if (!getSchoolProfile(school) || venues.some(v=>v.slug===original.slug)) continue;
  const overlay = reviewedCampusProfile(school,original.slug);
  const enriched = venueSchema.parse({...original,...overlay});
  for (const [key,value] of Object.entries(original)) if (!(key in overlay) && JSON.stringify(value)!==JSON.stringify(enriched[key as keyof typeof enriched])) throw Error(`Non-profile venue field changed: ${original.slug}.${key}`);
  venues.push(enriched);
}
const world = worldSchema.parse(annualWorld);
const catalogBody = { worlds: replaceOwned(catalog.worlds, [world]), courses: replaceOwned(catalog.courses, courses) };
const mapBody = { venues: replaceOwned(map.venues, venues) };
const catalogOut = { ...catalog, ...meta, generatedAt: annualOverlayTimestamp(catalog.generatedAt, generatedAt), ...catalogBody, integrity: { contentHash: hash(catalogBody) } };
const mapOut = { ...map, ...meta, generatedAt: annualOverlayTimestamp(map.generatedAt, generatedAt), ...mapBody, integrity: { contentHash: hash(mapBody) } };
const annualOffers = source.groups.map(original => {
  const live = refresh?.groups[original.id];
  const location = annualLocations.find(l => l.sourceId === original.locationId);
  if (!location) throw Error(`Unmapped group address ${original.id}`);
  const parsedYear = annualProgrammeName(live?.title ?? original.title).studyYear;
  const studyYear = reviewedStudyYear(location.schoolScopeSlug) ?? (parsedYear === 1 || parsedYear === 2 || parsedYear === 3 ? parsedYear : undefined);
  const expectedCode = reviewedGroupCodes[original.id] ?? original.groupCode;
  if (live && (live.listingId !== original.listingId || live.groupCode !== expectedCode)) throw Error(`Annual identity mismatch: ${original.id}`);
  const teacher = reviewedTeacher(location.schoolScopeSlug, studyYear) ?? original.teacher ?? (live?.title.match(/Хмельков\s+Д\.?\s*А\.?/u) ? "Хмельков Д. А." : live?.teacher ?? null);
  const g = live ? { ...original, ...live, teacher, title: original.title, linkKind: "card" as const,
    limitedSource: [live.ageMin,live.ageMax,live.lessonPrice,live.coursePrice,live.totalSeats,live.freeSeats,teacher].some(v=>v===null) } : {...original, teacher};
  const weekly = g.slots.map(s => `${s.weekday}: ${s.start}–${s.end}`).join("; ");
  const price = g.lessonPrice === null ? "Стоимость уточняется" : `${g.lessonPrice} ₽ / занятие`;
  const name = annualProgrammeName(g.title, studyYear);
  return venueOfferSchema.parse({ id: `year:${g.id}`, venueSlug: location.slug, shiftLabel: name.short,
    startDate: g.courseStart, endDate: g.courseEnd, startTime: g.slots[0].start, endTime: g.slots[0].end,
    dateRange: `${g.courseStart} — ${g.courseEnd}`, daySchedule: weekly, weeklySlots: g.slots, priceLabel: price, mosBookingUrl: g.link,
    annual: { sourceTitle: original.title, studyYear, refreshedAt: live?.refreshedAt,
      refreshError: refresh?.errors.find(e => e.groupId === original.id)?.code,
      teacherSourceConflict: !!live?.teacher && !!teacher && live.teacher.split(" ")[0] !== teacher.split(" ")[0],
      asOf: source.asOf, sourceSha256: source.sourceSha256, listingId: g.listingId, groupCode: g.groupCode,
      admission: g.status, teacher: g.teacher, ageMin: g.ageMin, ageMax: g.ageMax, totalSeats: g.totalSeats, freeSeats: g.freeSeats,
      lessonPrice: g.lessonPrice, coursePrice: g.coursePrice, linkKind: g.linkKind, limitedSource: g.limitedSource },
    sheetStatus: "Идёт набор",
    enrolled: g.totalSeats !== null && g.freeSeats !== null && g.totalSeats > 0 ? g.totalSeats - g.freeSeats : undefined,
    maxCapacity: g.totalSeats !== null && g.totalSeats > 0 ? g.totalSeats : undefined,
    scheduleCard: { displayTitle: name.short, teacherName: g.teacher, description: `Данные mos.ru на ${live?.refreshedAt.slice(0,10) ?? source.asOf}. Условия и наличие мест проверьте перед записью.`,
      ageLabel: g.ageMin === null || g.ageMax === null ? "Уточните у школы" : `${g.ageMin}–${g.ageMax} лет`,
      tags: ["Годовая программа", `Срез ${source.asOf}`], registrationChannel: "mos_ru", allowWaitlistWhenSoldOut: false,
      variants: [{ id: `year:${g.id}:main`, type: "Годовая группа", time: weekly, priceLabel: price }] },
  });
});
const ownedOfferIds = new Set(annualOffers.map(o => o.id));
for (const offer of offers.offersByQuest.shmi ?? []) {
  if (!ownedOfferIds.has(offer.id)) continue;
  const incoming = offer.annual;
  if (incoming && (incoming.asOf > source.asOf || (incoming.asOf === source.asOf && incoming.sourceSha256 !== source.sourceSha256))) {
    throw Error(`Newer or conflicting annual source revision: ${offer.id}`);
  }
}
const retainedShmi = (offers.offersByQuest.shmi ?? []).filter((o: { id: string }) => !ownedOfferIds.has(o.id));
const offersOut = { ...offers, generatedAt: annualOverlayTimestamp(offers.generatedAt, generatedAt), source: "annual-csv-integration", offersByQuest: { ...offers.offersByQuest, shmi: [...retainedShmi, ...annualOffers] } };
const manifestOut = { ...manifest, ...meta, generatedAt: annualOverlayTimestamp(manifest.generatedAt, generatedAt), snapshots: { ...manifest.snapshots,
  catalog: { path: "data/v2/catalog-snapshot.json", contentHash: catalogOut.integrity.contentHash },
  map: { path: "data/v2/map-snapshot.json", contentHash: mapOut.integrity.contentHash },
  schedule: { path: "data/offers-snapshot.json" },
} };
// The retained annual-table consumer requires a coherent source revision.
// Validate that projection before any file can be written, including future IDs.
projectAnnualWorkspace(catalogBody.courses.map(course => ({
  ...course, offers: offersOut.offersByQuest[course.slug] ?? [],
})), mapBody.venues);
catalogSnapshotSchema.parse(catalogOut); mapSnapshotSchema.parse(mapOut); siteManifestV2Schema.parse(manifestOut);
if (parseOffersSnapshot(offersOut).source === "invalid_file") throw Error("Invalid compiled offers");
const knownVenues = new Set(mapBody.venues.map(v => v.slug));
const knownCourses = new Set(catalogBody.courses.map(c => c.slug));
const ids = new Set<string>();
for (const [course, rows] of Object.entries(offersOut.offersByQuest)) {
  if (!knownCourses.has(course)) throw Error(`Unknown course ${course}`);
  for (const row of rows as { id: string; venueSlug: string }[]) {
    if (ids.has(row.id) || !knownVenues.has(row.venueSlug)) throw Error(`Duplicate/orphan offer ${row.id}`);
    ids.add(row.id);
  }
}
// Every non-owned record must survive byte-equivalent JSON serialization.
for (const [key, rows] of Object.entries(originalOffers)) {
  const keep = (rows as { id: string }[]).filter(o => key !== "shmi" || !ownedOfferIds.has(o.id));
  const after = offersOut.offersByQuest[key].filter((o: { id: string }) => key !== "shmi" || !ownedOfferIds.has(o.id));
  if (JSON.stringify(keep) !== JSON.stringify(after)) throw Error(`Existing offers changed ${key}`);
}
for (const [key, before, after, owned] of [
  ["worlds", originals.worlds, catalogBody.worlds, new Set([world.slug])],
  ["courses", originals.courses, catalogBody.courses, new Set(courses.map(c => c.slug))],
  ["venues", originals.venues, mapBody.venues, new Set(venues.map(v => v.slug))],
] as const) {
  for (const row of before) if (!owned.has(row.slug) && JSON.stringify(row) !== JSON.stringify(after.find(x => x.slug === row.slug))) throw Error(`Existing ${key} changed`);
}
const outputs: Record<string, unknown> = {
  "data/v2/catalog-snapshot.json": catalogOut, "data/v2/map-snapshot.json": mapOut,
  "data/offers-snapshot.json": offersOut, "data/v2/site-manifest.json": manifestOut,
};
for (const course of courses) {
  const detail = { ...meta, course, integrity: { contentHash: hash({ course }) } };
  courseDetailSnapshotSchema.parse(detail); outputs[`data/v2/detail/${course.slug}.json`] = detail;
}
for (const value of Object.values(outputs)) assertNoPrivateFields(value);
const tier = process.argv.find(arg => arg.startsWith("--tier="))?.slice(7) ?? "all";
const selected = selectAnnualOutputs(outputs, tier) as Record<string, unknown>;
const action = process.argv[2];
if (action !== "--write" && action !== "--check") throw Error("Choose --write or --check");
if (action === "--check") {
  for (const [rel, value] of Object.entries(selected)) if (fs.readFileSync(path.join(web, rel), "utf8") !== encode(value)) throw Error(`Projection drift: ${rel}`);
} else {
  const backup = fs.mkdtempSync(path.join(os.tmpdir(), "questhub-year-data-backup-"));
  for (const rel of Object.keys(selected)) {
    if (!fs.existsSync(path.join(web, rel))) continue;
    fs.mkdirSync(path.dirname(path.join(backup, rel)), { recursive: true }); fs.copyFileSync(path.join(web, rel), path.join(backup, rel));
  }
  console.log("Backup:", backup);
  for (const [rel, value] of Object.entries(selected)) { fs.mkdirSync(path.dirname(path.join(web, rel)), { recursive: true }); fs.writeFileSync(path.join(web, rel), encode(value)); }
}
console.log(JSON.stringify({ action, worlds: catalogBody.worlds.length, courses: catalogBody.courses.length, venues: mapBody.venues.length, annualGroups: annualOffers.length, weeklySlots: source.groups.reduce((n,g) => n + g.slots.length,0), preservedExistingRecords: true }));
