/** Local, backed-up source migration. No network, credentials, publication or guard bypass. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {composeSchool37,school37BaseDigest as baseSourceDigest,school37Identities} from './lib/school-37-source.mjs';
import {yearScheduleSchema} from '../apps/web/lib/year-schedule';
import {annualMosRefreshSchema,annualMosCardSchema} from '../apps/web/lib/offers/annual-schedule';
import {parseOffersSnapshot} from '../apps/web/lib/offers/snapshot-parse';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web = path.join(root,'apps/web');
const paths = ['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
const bytes = paths.map(p => fs.readFileSync(path.join(web,p),'utf8'));
const [source,registry,offers] = bytes.map(b => JSON.parse(b));
const addition = JSON.parse(fs.readFileSync(path.join(web,'content/annual-additions/school-37.json'),'utf8'));
const addedIds = new Set(school37Identities.map(([id]) => id));
const base = {...source,sourceSha256:baseSourceDigest,groups:source.groups.filter((g:{id:string}) => !addedIds.has(g.id)),locations:source.locations.filter((l:{id:string}) => !['LOC-012'].includes(l.id))};
const composed = yearScheduleSchema.parse(composeSchool37(base,addition));
const old = source.sourceSha256 === baseSourceDigest;
const expected = ['ea6fb0451bf1501174ba4211eb3df411cddf03eb865bb1eca044df37bee4b99e','4c32b6b7d37509ac7b50321963a528f4801fca566b7281055c0077f238b25d95','a3bc43bcc6cd75dc9fb0a5da24f1fd98dd535444490c878694fb1b3e5c892a58'];
const byteHash=(s:string)=>crypto.createHash('sha256').update(s).digest('hex');
if (JSON.stringify(source) !== JSON.stringify(old ? base : composed)) throw Error('ANNUAL_SOURCE_PREIMAGE_MISMATCH');
if (registry.sourceSha256 !== source.sourceSha256 || registry.expectedGroups !== source.groups.length) throw Error('ANNUAL_REGISTRY_PREIMAGE_MISMATCH');
if (parseOffersSnapshot(offers).source === 'invalid_file') throw Error('ANNUAL_OFFERS_INVALID');
const rows = Object.values(offers.offersByQuest).flat() as {id:string;annual?:{sourceSha256:string}}[];
for (const row of rows) if(row.annual && row.annual.sourceSha256 !== source.sourceSha256) throw Error('ANNUAL_OFFERS_REVISION_MISMATCH');
const actualIds = rows.filter(o=>o.annual).map(o=>o.id).sort();
if(new Set(rows.map(o=>o.id)).size!==rows.length)throw Error('ANNUAL_OFFERS_DUPLICATE');
const ownedIds=new Set(source.groups.map((g:{id:string})=>`year:${g.id}`));
const actualOwned=actualIds.filter(id=>ownedIds.has(id));
const complete=JSON.stringify(actualOwned)===JSON.stringify([...ownedIds].sort());
let needsCompilation=false;
if(!complete){
  // A stopped import can leave the exact migrated60 offers before compilation.
  // Accept that precise state only; arbitrary missing/edited offers still fail.
  const previousIds=base.groups.map((g:{id:string})=>`year:${g.id}`).sort();
  if(old || JSON.stringify(actualIds)!==JSON.stringify(previousIds))throw Error('ANNUAL_OFFERS_IDENTITY_MISMATCH');
  const originalOffers=structuredClone(offers);
  for(const row of Object.values(originalOffers.offersByQuest).flat() as {annual?:{sourceSha256:string}}[])if(row.annual)row.annual.sourceSha256=baseSourceDigest;
  const originalRegistry=structuredClone(registry);
  originalRegistry.sourceSha256=baseSourceDigest;originalRegistry.expectedGroups=base.groups.length;
  for(const {locationId,...card} of addition.groups){
    void locationId;
    if(JSON.stringify(annualMosCardSchema.parse(registry.groups[card.groupCode]))!==
      JSON.stringify(annualMosCardSchema.parse(card)))throw Error('ANNUAL_MIGRATION_INTERMEDIATE_CARD_CHANGED');
  }
  for(const id of addedIds)delete originalRegistry.groups[id];
  if(byteHash(JSON.stringify(originalOffers,null,2)+'\n')!==expected[2] ||
    byteHash(JSON.stringify(originalRegistry,null,2)+'\n')!==expected[1])throw Error('ANNUAL_MIGRATION_INTERMEDIATE_CHANGED');
  needsCompilation=true;
}
annualMosRefreshSchema.parse(registry);
if (old) {
  if(bytes.some((b,i)=>crypto.createHash('sha256').update(b).digest('hex')!==expected[i])) throw Error('ANNUAL_MIGRATION_PREIMAGE_CHANGED');
  registry.sourceSha256 = composed.sourceSha256;
  registry.expectedGroups = composed.groups.length;
  // This imports verified source cards; it is not a successful whole-registry sync.
  for (const {locationId,...card} of addition.groups) {
    void locationId;
    if(registry.groups[card.groupCode]) throw Error('ANNUAL_MIGRATION_DUPLICATE');
    registry.groups[card.groupCode] = annualMosCardSchema.parse(card);
  }
  for (const row of rows) if(row.annual) row.annual.sourceSha256 = composed.sourceSha256;
  needsCompilation=true;
} else {
  for(const [id,cardId] of school37Identities) {
    const card=registry.groups[id];
    if(!card || card.cardId!==cardId || card.listingId!=='2553800') throw Error('ANNUAL_MIGRATION_CARD_MISSING');
  }
}
annualMosRefreshSchema.parse(registry);
if(new Set(Object.values(registry.groups).map(g=>(g as {cardId:string}).cardId)).size!==Object.keys(registry.groups).length) throw Error('ANNUAL_MIGRATION_DUPLICATE_CARD');
const action=process.argv[2];
if(!['--write','--check'].includes(action)) throw Error('Choose --write or --check');
if(action==='--check' && old) throw Error('ANNUAL_MIGRATION_REQUIRED');
if(action==='--write' && old){
  const backup=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-school37-backup-'));
  for(let i=0;i<paths.length;i++){const target=path.join(backup,paths[i]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes[i],{flag:'wx'});}
  const next=[composed,registry,offers].map(v=>JSON.stringify(v,null,2)+'\n');
  // Local operation only, with exact preimages and recovery for partial I/O failure.
  try{for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),next[i]);}
  catch(error){for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),bytes[i]);throw error;}
  console.log(JSON.stringify({backup}));
}
console.log(JSON.stringify({action,groups:composed.groups.length,locations:composed.locations.length,sourceSha256:composed.sourceSha256,alreadyImported:!old,needsCompilation}));
