/** Backed-up, exact-preimage local migration. No network or publication. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {composeSchool2103Replacement,school2103ReplacementBase,replacementIdentities} from './lib/school-2103-replacement-source.mjs';
import {yearScheduleSchema} from '../apps/web/lib/year-schedule';
import {annualMosCardSchema,annualMosRefreshSchema} from '../apps/web/lib/offers/annual-schedule';
import {parseOffersSnapshot} from '../apps/web/lib/offers/snapshot-parse';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../apps/web');
const paths=['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
const bytes=paths.map(p=>fs.readFileSync(path.join(web,p),'utf8'));
const [source,registry,offers]=bytes.map(b=>JSON.parse(b));
const addition=JSON.parse(fs.readFileSync(path.join(web,'content/annual-additions/school-2103-replacement.json'),'utf8'));
const newIds=new Set(replacementIdentities.map(r=>r[0]));
const base={...source,sourceSha256:school2103ReplacementBase,groups:source.groups.filter((g:{id:string})=>!newIds.has(g.id))};
const composed=yearScheduleSchema.parse(composeSchool2103Replacement(base,addition));
const old=source.sourceSha256===school2103ReplacementBase;
if(JSON.stringify(yearScheduleSchema.parse(source))!==JSON.stringify(old?yearScheduleSchema.parse(base):composed))throw Error('SCHOOL2103_SOURCE_CHANGED');
annualMosRefreshSchema.parse(registry);
if(registry.sourceSha256!==source.sourceSha256||registry.expectedGroups!==source.groups.length)throw Error('SCHOOL2103_REGISTRY_CHANGED');
if(parseOffersSnapshot(offers).source==='invalid_file')throw Error('SCHOOL2103_OFFERS_INVALID');
const rows=Object.values(offers.offersByQuest).flat() as {id:string;annual?:{sourceSha256:string}}[];
if(new Set(rows.map(o=>o.id)).size!==rows.length||rows.some(o=>o.annual&&o.annual.sourceSha256!==source.sourceSha256))throw Error('SCHOOL2103_OFFERS_CHANGED');
const action=process.argv[2];if(!['--write','--check'].includes(action))throw Error('Choose --write or --check');
if(old){
 const expected=['ddab7f7beae1fe2acc061574747543ebaf844942a2d1a4610645edf2e33bf24c', '2454bec8f83827924711ffdf22d9c2c8d3a49834aac1b635ac43fbfc71cbe576', '28a1105e84bee528335eddeb9773b57643e02309846109dcc7d6c026c96271de'];
 if(bytes.some((b,i)=>crypto.createHash('sha256').update(b).digest('hex')!==expected[i]))throw Error('SCHOOL2103_PREIMAGE_CHANGED');
 if(action==='--check')throw Error('SCHOOL2103_MIGRATION_REQUIRED');
 registry.sourceSha256=composed.sourceSha256;registry.expectedGroups=composed.groups.length;
 // Keep whole-run timestamp, errors and coverage: eleven reads are not a successful full sync.
 for(const {locationId,studyYear,...card} of addition.groups){
  void locationId;void studyYear;registry.groups[card.groupCode]=annualMosCardSchema.parse(card);
 }
 for(const row of rows)if(row.annual)row.annual.sourceSha256=composed.sourceSha256;
}else{
 for(const [code,cardId,listing] of replacementIdentities){
  if(registry.groups[code]?.cardId!==cardId||registry.groups[code]?.listingId!==listing)throw Error('SCHOOL2103_REGISTRY_IDENTITY');
 }
}
annualMosRefreshSchema.parse(registry);
if(new Set(Object.values(registry.groups).map(g=>(g as {cardId:string}).cardId)).size!==Object.keys(registry.groups).length)throw Error('SCHOOL2103_DUPLICATE_CARD');
if(old){
 const backup=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-2103-replacement-'));
 for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(backup,`${i}.json`),bytes[i],{flag:'wx'});
 if(paths.some((p,i)=>fs.readFileSync(path.join(web,p),'utf8')!==bytes[i]))throw Error('SCHOOL2103_CONCURRENT_CHANGE');
 const next=[composed,registry,offers].map(v=>JSON.stringify(v,null,2)+'\n');
 try{for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),next[i]);}
 catch(e){for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),bytes[i]);throw e;}
 console.log(JSON.stringify({backup}));
}
console.log(JSON.stringify({action,alreadyImported:!old,groups:composed.groups.length}));
