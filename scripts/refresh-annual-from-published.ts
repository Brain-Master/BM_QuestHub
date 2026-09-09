/** Read-only network -> validated local generated registry. No remote writes. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { activeS3Credentials } from "./lib/s3-storage.mjs";
import { restorePublishedAnnual } from "./lib/mos-annual-published.mjs";
import { refreshAnnualCards } from "./lib/mos-annual-refresh.mjs";
import { annualMosRefreshSchema } from "../apps/web/lib/offers/annual-schedule";
import { parseOffersSnapshot } from "../apps/web/lib/offers/snapshot-parse";
import { annualLocations } from "../apps/web/content/year-integration";
import { yearScheduleSchema } from "../apps/web/lib/year-schedule";
import { reviewedStudyYear } from "../apps/web/content/annual-group-overrides";
import { annualProgrammeName } from "../apps/web/lib/offers/annual-programme-name";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "apps/web/content/annual-mos-refresh.generated.json");
const registry = annualMosRefreshSchema.parse(JSON.parse(fs.readFileSync(target, "utf8")));
const source = yearScheduleSchema.parse(JSON.parse(fs.readFileSync(path.join(root,"apps/web/content/year-schedule.generated.json"),"utf8")));
if (source.sourceSha256 !== registry.sourceSha256) throw Error("ANNUAL_SOURCE_REVISION_MISMATCH");
const venueByGroup = Object.fromEntries(source.groups.map(g=>{
  const venue=annualLocations.find(l=>l.sourceId===g.locationId);
  if(!venue)throw Error("ANNUAL_SOURCE_VENUE_MISSING");
  return [g.id,venue.slug];
}));
const studyYearByGroup=Object.fromEntries(source.groups.map(g=>[g.id,
  reviewedStudyYear(annualLocations.find(l=>l.sourceId===g.locationId)!.schoolScopeSlug) ?? annualProgrammeName(registry.groups[g.id]?.title ?? g.title).studyYear]));
const c = activeS3Credentials();
if (!c.accessKeyId || !c.secretAccessKey) throw Error("ANNUAL_BASELINE_CREDENTIALS_MISSING");
const client = new S3Client({ endpoint: c.endpoint, region: c.region, forcePathStyle: true,
  credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey }, maxAttempts: 2 });
try {
  const response = await client.send(new GetObjectCommand({Bucket: c.bucket, Key: "data/offers-snapshot.json"}), {abortSignal: AbortSignal.timeout(25000)});
  if (!response.Body || (response.ContentLength ?? 0) > 10_000_000) throw Error("ANNUAL_BASELINE_INVALID");
  const parsed = parseOffersSnapshot(JSON.parse(await response.Body.transformToString()));
  if (parsed.source === "invalid_file") throw Error("ANNUAL_BASELINE_INVALID");
  const restored = annualMosRefreshSchema.parse(restorePublishedAnnual(registry, Object.values(parsed.offersByQuest).flat(), {asOf:source.asOf,venueByGroup,studyYearByGroup}));
  const report = annualMosRefreshSchema.parse(await refreshAnnualCards(restored, { sourceGroups: Object.fromEntries(source.groups.map(g=>[g.id,g])) }));
  fs.writeFileSync(target, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({annualVerified: report.verifiedGroups, annualExpected: report.expectedGroups, ok: report.ok, errors: report.errors}));
  // Partial coverage is surfaced by the workflow AFTER publishing safe last-known values.
} finally { client.destroy(); }
