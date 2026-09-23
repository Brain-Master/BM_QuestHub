/** Backed-up local migration; never reads credentials or publishes. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {confirmedBaseDigest,historical69,composeConfirmedSchools} from './lib/confirmed-school-source.mjs';
import {yearScheduleSchema} from '../apps/web/lib/year-schedule';
import {annualMosCardSchema,annualMosRefreshSchema} from '../apps/web/lib/offers/annual-schedule';
import {parseOffersSnapshot} from '../apps/web/lib/offers/snapshot-parse';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),web=path.join(root,'apps/web');
const paths=['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
const bytes=paths.map(p=>fs.readFileSync(path.join(web,p),'utf8'));
const [source,registry,offers]=bytes.map(b=>JSON.parse(b));
const addition=(id:string)=>JSON.parse(fs.readFileSync(path.join(web,`content/annual-additions/school-${id}.json`),'utf8'));
const a=addition('1212'),b=addition('937');
const composed=yearScheduleSchema.parse(composeConfirmedSchools(historical69(source),a,b));
const old=source.sourceSha256===confirmedBaseDigest;
if(JSON.stringify(yearScheduleSchema.parse(source))!==JSON.stringify(old?yearScheduleSchema.parse(historical69(source)):composed))throw Error('CONFIRMED_SOURCE_CHANGED');
annualMosRefreshSchema.parse(registry);
if(registry.sourceSha256!==source.sourceSha256||registry.expectedGroups!==source.groups.length)throw Error('CONFIRMED_REGISTRY_CHANGED');
if(parseOffersSnapshot(offers).source==='invalid_file')throw Error('CONFIRMED_OFFERS_INVALID');
const rows=Object.values(offers.offersByQuest).flat() as {id:string;annual?:{sourceSha256:string}}[];
const annual=rows.filter(o=>o.annual);
if(new Set(rows.map(o=>o.id)).size!==rows.length||annual.some(o=>o.annual!.sourceSha256!==source.sourceSha256))throw Error('CONFIRMED_OFFERS_CHANGED');
const expectedIds=(old?source:composed).groups.map((g:{id:string})=>`year:${g.id}`).sort();
const actualIds=annual.map(o=>o.id).sort();
const intermediateIds=historical69(source).groups.map((g:{id:string})=>`year:${g.id}`).sort();
if(JSON.stringify(actualIds)!==JSON.stringify(expectedIds)&&(!old&&JSON.stringify(actualIds)!==JSON.stringify(intermediateIds)))throw Error('CONFIRMED_OFFERS_IDENTITY');
const action=process.argv[2];if(!['--write','--check'].includes(action))throw Error('Choose --write or --check');
if(old){
 const expected=['101f89158a7310f4adc798a287b6f2711fa073c042da77490cce8c66e170bc68','2e38a2a0bbc8431cc7364db62d9b8145b621f6e6df2a4397b87ca634e4a50c65','e664798f41f15a423c82062f14c118e2d2a286648c6f0732d187e202b4a70526'];
 if(bytes.some((v,i)=>crypto.createHash('sha256').update(v).digest('hex')!==expected[i]))throw Error('CONFIRMED_PREIMAGE_CHANGED');
 if(action==='--check')throw Error('CONFIRMED_MIGRATION_REQUIRED');
 registry.sourceSha256=composed.sourceSha256;registry.expectedGroups=composed.groups.length;
 // Keep attemptedAt/coverage/errors: manual extracts are not a successful scheduled sync.
 for(const {locationId,...card} of [...a.groups,...b.groups]){
  void locationId;registry.groups[card.groupCode]=annualMosCardSchema.parse(card);
 }
 for(const row of annual)row.annual!.sourceSha256=composed.sourceSha256;
}else{
 for(const card of [...a.groups,...b.groups]){
  const current=registry.groups[card.groupCode];
  if(!current||current.cardId!==card.cardId||current.listingId!==card.listingId||current.refreshedAt<card.refreshedAt)throw Error('CONFIRMED_REGISTRY_IDENTITY');
 }
}
annualMosRefreshSchema.parse(registry);
if(new Set(Object.values(registry.groups).map(g=>(g as {cardId:string}).cardId)).size!==Object.keys(registry.groups).length)throw Error('CONFIRMED_DUPLICATE_CARD');
if(old){
 const backup=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-confirmed-schools-'));
 for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(backup,`${i}.json`),bytes[i],{flag:'wx'});
 if(paths.some((p,i)=>fs.readFileSync(path.join(web,p),'utf8')!==bytes[i]))throw Error('CONFIRMED_CONCURRENT_CHANGE');
 const next=[composed,registry,offers].map(v=>JSON.stringify(v,null,2)+'\n');
 try{for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),next[i]);}
 catch(e){for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),bytes[i]);throw e;}
 console.log(JSON.stringify({backup}));
}
console.log(JSON.stringify({action,alreadyImported:!old,groups:composed.groups.length,needsCompilation:old||annual.length!==composed.groups.length}));
