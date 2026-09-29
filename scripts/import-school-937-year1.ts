/** Backed-up, exact-preimage local migration. No network or publication. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {composeSchool937Year1,school937Year1Base,school937Year1Identities} from './lib/school-937-year1-source.mjs';
import {yearScheduleSchema} from '../apps/web/lib/year-schedule';
import {annualMosCardSchema,annualMosRefreshSchema} from '../apps/web/lib/offers/annual-schedule';
import {parseOffersSnapshot} from '../apps/web/lib/offers/snapshot-parse';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../apps/web');
const paths=['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
const bytes=paths.map(p=>fs.readFileSync(path.join(web,p),'utf8'));
const [source,registry,offers]=bytes.map(b=>JSON.parse(b));
const addition=JSON.parse(fs.readFileSync(path.join(web,'content/annual-additions/school-937-year1.json'),'utf8'));
const newIds=new Set(school937Year1Identities.filter(r=>r[3]===1).map(r=>r[0]));
const base={...source,sourceSha256:school937Year1Base,groups:source.groups.filter((g:{id:string})=>!newIds.has(g.id))};
const composed=yearScheduleSchema.parse(composeSchool937Year1(base,addition));
const old=source.sourceSha256===school937Year1Base;
if(JSON.stringify(yearScheduleSchema.parse(source))!==JSON.stringify(old?yearScheduleSchema.parse(base):composed))throw Error('SCHOOL937_SOURCE_CHANGED');
annualMosRefreshSchema.parse(registry);
if(registry.sourceSha256!==source.sourceSha256||registry.expectedGroups!==source.groups.length)throw Error('SCHOOL937_REGISTRY_CHANGED');
if(parseOffersSnapshot(offers).source==='invalid_file')throw Error('SCHOOL937_OFFERS_INVALID');
const rows=Object.values(offers.offersByQuest).flat() as {id:string;annual?:{sourceSha256:string}}[];
if(new Set(rows.map(o=>o.id)).size!==rows.length||rows.some(o=>o.annual&&o.annual.sourceSha256!==source.sourceSha256))throw Error('SCHOOL937_OFFERS_CHANGED');
const action=process.argv[2];if(!['--write','--check'].includes(action))throw Error('Choose --write or --check');
if(old){
 const expected=['671d46a2f9378284702d211d1cb5d85c93498c6cfaa08e21d996348a0a257d8e','9c444307cff1a417f73971c2a87b797a4faff4136f363c534d5b15a6ecd5e695','ed6d437d13190a54b44dbe53c29c69f75f41a0cf63ec83eaa8020214b69e8839'];
 if(bytes.some((b,i)=>crypto.createHash('sha256').update(b).digest('hex')!==expected[i]))throw Error('SCHOOL937_PREIMAGE_CHANGED');
 if(action==='--check')throw Error('SCHOOL937_MIGRATION_REQUIRED');
 registry.sourceSha256=composed.sourceSha256;registry.expectedGroups=composed.groups.length;
 // Keep whole-run timestamp, errors and coverage: eight reads are not a successful full sync.
 for(const {locationId,studyYear,...card} of addition.groups){
  void locationId;void studyYear;registry.groups[card.groupCode]=annualMosCardSchema.parse(card);
 }
 for(const row of rows)if(row.annual)row.annual.sourceSha256=composed.sourceSha256;
}else{
 for(const [code,cardId,listing] of school937Year1Identities){
  if(registry.groups[code]?.cardId!==cardId||registry.groups[code]?.listingId!==listing)throw Error('SCHOOL937_REGISTRY_IDENTITY');
 }
}
annualMosRefreshSchema.parse(registry);
if(new Set(Object.values(registry.groups).map(g=>(g as {cardId:string}).cardId)).size!==Object.keys(registry.groups).length)throw Error('SCHOOL937_DUPLICATE_CARD');
if(old){
 const backup=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-937-year1-'));
 for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(backup,`${i}.json`),bytes[i],{flag:'wx'});
 if(paths.some((p,i)=>fs.readFileSync(path.join(web,p),'utf8')!==bytes[i]))throw Error('SCHOOL937_CONCURRENT_CHANGE');
 const next=[composed,registry,offers].map(v=>JSON.stringify(v,null,2)+'\n');
 try{for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),next[i]);}
 catch(e){for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),bytes[i]);throw e;}
 console.log(JSON.stringify({backup}));
}
console.log(JSON.stringify({action,alreadyImported:!old,groups:composed.groups.length}));
