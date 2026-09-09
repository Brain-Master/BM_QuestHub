/** Bounded source discovery + exact-card read. No S3/Sheets writes or booking actions. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchMosListing, fetchMosCard, requestMosJson } from "./lib/mos-annual-cards.mjs";
import { reviewedGroupCodes } from "../apps/web/content/annual-group-overrides.ts";
import { groupLifecycle } from "./lib/mos-group-lifecycle.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(fs.readFileSync(path.join(root, "apps/web/content/year-schedule.generated.json"), "utf8"));
const output = process.argv.find(arg => arg.startsWith("--output="))?.slice(9);
if (!output) throw Error("Explicit --output= path required");
const groups = {}, errors = [], candidates = {}, discovered = new Map();
const activeGroups = source.groups.filter(g=>["current","future"].includes(groupLifecycle(g).state));
const archivedGroups = source.groups.filter(g=>groupLifecycle(g).state==="archived").length;
for (const group of source.groups) if(groupLifecycle(group).state==="unknown") errors.push({groupId:group.id,phase:"lifecycle",code:groupLifecycle(group).reason});
const listingIds = [...new Set(activeGroups.map(g => g.listingId))];
for (const listingId of listingIds) {
  try {
    const search = await searchMosListing(listingId), byCard = new Map();
    // Search collapses sibling groups to a representative. Expand its public card.
    for (const item of search) {
      const data = await requestMosJson(`/groups/${item.group.id}`);
      for (const candidate of [data.item, ...(data.otherItems ?? [])]) {
        if (String(candidate?.circle?.number) === listingId && candidate.group?.id) byCard.set(String(candidate.group.id), candidate);
      }
    }
    discovered.set(listingId, [...byCard.values()]);
  }
  catch (e) { errors.push({ listingId, phase: "search", code: e.name === "TimeoutError" ? "MOS_TIMEOUT" : e.message }); }
}
for (const group of activeGroups) {
  const expected = { ...group, groupCode: reviewedGroupCodes[group.id] ?? group.groupCode };
  const items = discovered.get(group.listingId);
  if (!items) continue;
  const matches = items.filter(item => expected.groupCode && item.group?.number === expected.groupCode);
  if (matches.length !== 1) {
    candidates[group.id] = items.map(item => ({ cardId: item.group.id, groupCode: item.group.number, title: item.group.name, address: item.group.fullAddress }));
    errors.push({ groupId: group.id, phase: "identity", code: matches.length ? "MOS_AMBIGUOUS_GROUP" : "MOS_GROUP_NOT_FOUND" });
    continue;
  }
  try {
    groups[group.id] = { ...await fetchMosCard(matches[0].group.id, expected), refreshedAt: new Date().toISOString() };
    console.log(`[annual-mos] ${group.id}: verified card ${groups[group.id].cardId}`);
  } catch (e) { errors.push({ groupId: group.id, phase: "card", code: e.name === "TimeoutError" ? "MOS_TIMEOUT" : e.message }); }
}
const report = { version: 1, sourceSha256: source.sourceSha256, attemptedAt: new Date().toISOString(), expectedGroups: source.groups.length,
  verifiedGroups: Object.keys(groups).length, archivedGroups, ok: errors.length === 0 && Object.keys(groups).length + archivedGroups === source.groups.length, groups, candidates, errors };
fs.writeFileSync(path.resolve(output), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ expected: report.expectedGroups, verified: report.verifiedGroups, errors: report.errors, output }));
if (!report.ok) process.exitCode = 2;
