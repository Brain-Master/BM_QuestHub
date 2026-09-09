/** Refresh a known registry to an explicit output; no credentials or remote writes. */
import fs from "node:fs";
import {createRequire} from "node:module";
import { refreshAnnualCards } from "./lib/mos-annual-refresh.mjs";
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {require:tsRequire}=require('tsx/cjs/api');
const {yearScheduleSchema}=tsRequire('../apps/web/lib/year-schedule.ts',import.meta.url);
const {annualMosRefreshSchema}=tsRequire('../apps/web/lib/offers/annual-schedule.ts',import.meta.url);
const input = process.argv.find(a => a.startsWith("--input="))?.slice(8);
const output = process.argv.find(a => a.startsWith("--output="))?.slice(9);
if (!input || !output || input === output) throw Error("Distinct explicit --input and --output paths required");
const registry = annualMosRefreshSchema.parse(JSON.parse(fs.readFileSync(input, "utf8")));
const sourcePath=process.argv.find(a=>a.startsWith('--source='))?.slice(9) ?? new URL('../apps/web/content/year-schedule.generated.json',import.meta.url);
const source=yearScheduleSchema.parse(JSON.parse(fs.readFileSync(sourcePath,'utf8')));
if(source.sourceSha256!==registry.sourceSha256||source.groups.length!==registry.expectedGroups||Object.keys(registry.groups).some(id=>!source.groups.some(g=>g.id===id)))throw Error('ANNUAL_SOURCE_REVISION_MISMATCH');
const result = annualMosRefreshSchema.parse(await refreshAnnualCards(registry,{sourceGroups:Object.fromEntries(source.groups.map(g=>[g.id,g]))}));
fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ok:result.ok,expected:result.expectedGroups,verified:result.verifiedGroups,errors:result.errors}));
if (!result.ok) process.exitCode = 2;
