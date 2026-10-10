/** Backed-up, exact-preimage local migration. No network or publication. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {composeSchool2044,school2044Base,school2044Identities} from './lib/school-2044-source.mjs';
import {yearScheduleSchema} from '../apps/web/lib/year-schedule';
import {annualMosCardSchema,annualMosRefreshSchema} from '../apps/web/lib/offers/annual-schedule';
import {parseOffersSnapshot} from '../apps/web/lib/offers/snapshot-parse';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../apps/web');
const paths=['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
const bytes=paths.map(p=>fs.readFileSync(path.join(web,p),'utf8'));
const [source,registry,offers]=bytes.map(b=>JSON.parse(b));
const addition=JSON.parse(fs.readFileSync(path.join(web,'content/annual-additions/school-2044.json'),'utf8'));
const newIds=new Set(school2044Identities.map(r=>r[0]));
const base={...source,sourceSha256:school2044Base,groups:source.groups.filter((g:{id:string})=>!newIds.has(g.id)),locations:source.locations.filter((l:{id:string})=>l.id!=='LOC-013')};
const composed=yearScheduleSchema.parse(composeSchool2044(base,addition));
const old=source.sourceSha256===school2044Base;
if(JSON.stringify(yearScheduleSchema.parse(source))!==JSON.stringify(old?yearScheduleSchema.parse(base):composed))throw Error('SCHOOL2044_SOURCE_CHANGED');
annualMosRefreshSchema.parse(registry);
if(registry.sourceSha256!==source.sourceSha256||registry.expectedGroups!==source.groups.length)throw Error('SCHOOL2044_REGISTRY_CHANGED');
if(parseOffersSnapshot(offers).source==='invalid_file')throw Error('SCHOOL2044_OFFERS_INVALID');
const rows=Object.values(offers.offersByQuest).flat() as {id:string;annual?:{sourceSha256:string}}[];
if(new Set(rows.map(o=>o.id)).size!==rows.length||rows.some(o=>o.annual&&o.annual.sourceSha256!==source.sourceSha256))throw Error('SCHOOL2044_OFFERS_CHANGED');
const action=process.argv[2];if(!['--write','--check'].includes(action))throw Error('Choose --write or --check');
if(old){
 const expected=['f62b2df860226fe2c3825bf07891bdc0d50d8b66786811f70048845787ec0e36', '8d0595fd83b8229a12772977a39bf08bd5ea5c94cfe7f758c3649d11bc126d99', 'd2102d6c3ea3ad4c71c414abc0893cb80818b6ab2be49c477cd52df2c02dce3d'];
 if(bytes.some((b,i)=>crypto.createHash('sha256').update(b).digest('hex')!==expected[i]))throw Error('SCHOOL2044_PREIMAGE_CHANGED');
 if(action==='--check')throw Error('SCHOOL2044_MIGRATION_REQUIRED');
 registry.sourceSha256=composed.sourceSha256;registry.expectedGroups=composed.groups.length;
 // Keep whole-run timestamp, errors and coverage: eleven reads are not a successful full sync.
 for(const {locationId,programmeTitle,...card} of addition.groups){
  void locationId;void programmeTitle;registry.groups[card.groupCode]=annualMosCardSchema.parse(card);
 }
 for(const row of rows)if(row.annual)row.annual.sourceSha256=composed.sourceSha256;
}else{
 for(const [code,cardId,listing] of school2044Identities){
  if(registry.groups[code]?.cardId!==cardId||registry.groups[code]?.listingId!==listing)throw Error('SCHOOL2044_REGISTRY_IDENTITY');
 }
}
annualMosRefreshSchema.parse(registry);
if(new Set(Object.values(registry.groups).map(g=>(g as {cardId:string}).cardId)).size!==Object.keys(registry.groups).length)throw Error('SCHOOL2044_DUPLICATE_CARD');
if(old){
 const backup=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-2044-'));
 for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(backup,`${i}.json`),bytes[i],{flag:'wx'});
 if(paths.some((p,i)=>fs.readFileSync(path.join(web,p),'utf8')!==bytes[i]))throw Error('SCHOOL2044_CONCURRENT_CHANGE');
 const next=[composed,registry,offers].map(v=>JSON.stringify(v,null,2)+'\n');
 try{for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),next[i]);}
 catch(e){for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),bytes[i]);throw e;}
 console.log(JSON.stringify({backup}));
}
console.log(JSON.stringify({action,alreadyImported:!old,groups:composed.groups.length}));
