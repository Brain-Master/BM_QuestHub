/** Backed-up, exact-preimage local migration. No network or publication. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {composeSchool1539Tuesday,school1539TuesdayBase,school1539TuesdayIdentities} from './lib/school-1539-tuesday-source.mjs';
import {yearScheduleSchema} from '../apps/web/lib/year-schedule';
import {annualMosCardSchema,annualMosRefreshSchema} from '../apps/web/lib/offers/annual-schedule';
import {parseOffersSnapshot} from '../apps/web/lib/offers/snapshot-parse';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../apps/web');
const paths=['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
const bytes=paths.map(p=>fs.readFileSync(path.join(web,p),'utf8'));
const [source,registry,offers]=bytes.map(b=>JSON.parse(b));
const addition=JSON.parse(fs.readFileSync(path.join(web,'content/annual-additions/school-1539-tuesday.json'),'utf8'));
const newIds=new Set(school1539TuesdayIdentities.map(r=>r[0]));
const base={...source,sourceSha256:school1539TuesdayBase,groups:source.groups.filter((g:{id:string})=>!newIds.has(g.id))};
const composed=yearScheduleSchema.parse(composeSchool1539Tuesday(base,addition));
const old=source.sourceSha256===school1539TuesdayBase;
if(JSON.stringify(yearScheduleSchema.parse(source))!==JSON.stringify(old?yearScheduleSchema.parse(base):composed))throw Error('SCHOOL1539_SOURCE_CHANGED');
annualMosRefreshSchema.parse(registry);
if(registry.sourceSha256!==source.sourceSha256||registry.expectedGroups!==source.groups.length)throw Error('SCHOOL1539_REGISTRY_CHANGED');
if(parseOffersSnapshot(offers).source==='invalid_file')throw Error('SCHOOL1539_OFFERS_INVALID');
const rows=Object.values(offers.offersByQuest).flat() as {id:string;annual?:{sourceSha256:string}}[];
if(new Set(rows.map(o=>o.id)).size!==rows.length||rows.some(o=>o.annual&&o.annual.sourceSha256!==source.sourceSha256))throw Error('SCHOOL1539_OFFERS_CHANGED');
const action=process.argv[2];if(!['--write','--check'].includes(action))throw Error('Choose --write or --check');
if(old){
 const expected=["28cebd90ca80f5c44db4049180717d42e0e666ec5b45225c7d6a2079481320c1", "e697aa7427d056908fadd65af7994518c9d8cac50f7f0f816a61b1dd1bfac696", "864de4b05c3a277856afe5800eba31133321c620a8ec4642bfbc62cd02bb6e95"];
 if(bytes.some((b,i)=>crypto.createHash('sha256').update(b).digest('hex')!==expected[i]))throw Error('SCHOOL1539_PREIMAGE_CHANGED');
 if(action==='--check')throw Error('SCHOOL1539_MIGRATION_REQUIRED');
 registry.sourceSha256=composed.sourceSha256;registry.expectedGroups=composed.groups.length;
 // Keep whole-run timestamp, errors and coverage: four reads are not a successful full sync.
 for(const {locationId,admissionStart,admissionEnd,...card} of addition.groups){
  void locationId;void admissionStart;void admissionEnd;registry.groups[card.groupCode]=annualMosCardSchema.parse(card);
 }
 for(const row of rows)if(row.annual)row.annual.sourceSha256=composed.sourceSha256;
}else{
 for(const [code,cardId,listing] of school1539TuesdayIdentities){
  if(registry.groups[code]?.cardId!==cardId||registry.groups[code]?.listingId!==listing)throw Error('SCHOOL1539_REGISTRY_IDENTITY');
 }
}
annualMosRefreshSchema.parse(registry);
if(new Set(Object.values(registry.groups).map(g=>(g as {cardId:string}).cardId)).size!==Object.keys(registry.groups).length)throw Error('SCHOOL1539_DUPLICATE_CARD');
if(old){
 const backup=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-1539-'));
 for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(backup,`${i}.json`),bytes[i],{flag:'wx'});
 if(paths.some((p,i)=>fs.readFileSync(path.join(web,p),'utf8')!==bytes[i]))throw Error('SCHOOL1539_CONCURRENT_CHANGE');
 const next=[composed,registry,offers].map(v=>JSON.stringify(v,null,2)+'\n');
 try{for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),next[i]);}
 catch(e){for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),bytes[i]);throw e;}
 console.log(JSON.stringify({backup}));
}
console.log(JSON.stringify({action,alreadyImported:!old,groups:composed.groups.length}));
