/** Local, backed-up source migration. No network, credentials, publication or guard bypass. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {composeSchool2103,baseSourceDigest,school2103Identities} from './lib/school-2103-source.mjs';
import {yearScheduleSchema} from '../apps/web/lib/year-schedule';
import {annualMosRefreshSchema,annualMosCardSchema} from '../apps/web/lib/offers/annual-schedule';
import {parseOffersSnapshot} from '../apps/web/lib/offers/snapshot-parse';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web = path.join(root,'apps/web');
const paths = ['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
const bytes = paths.map(p => fs.readFileSync(path.join(web,p),'utf8'));
const [source,registry,offers] = bytes.map(b => JSON.parse(b));
const addition = JSON.parse(fs.readFileSync(path.join(web,'content/annual-additions/school-2103.json'),'utf8'));
const addedIds = new Set(school2103Identities.map(([id]: string[]) => id));
const base = {...source,sourceSha256:baseSourceDigest,groups:source.groups.filter((g:{id:string}) => !addedIds.has(g.id)),locations:source.locations.filter((l:{id:string}) => !['LOC-009','LOC-010'].includes(l.id))};
const composed = yearScheduleSchema.parse(composeSchool2103(base,addition));
const old = source.sourceSha256 === baseSourceDigest;
if (JSON.stringify(source) !== JSON.stringify(old ? base : composed)) throw Error('ANNUAL_SOURCE_PREIMAGE_MISMATCH');
if (registry.sourceSha256 !== source.sourceSha256 || registry.expectedGroups !== source.groups.length) throw Error('ANNUAL_REGISTRY_PREIMAGE_MISMATCH');
if (parseOffersSnapshot(offers).source === 'invalid_file') throw Error('ANNUAL_OFFERS_INVALID');
const rows = Object.values(offers.offersByQuest).flat() as {id:string;annual?:{sourceSha256:string}}[];
for (const row of rows) if(row.annual && row.annual.sourceSha256 !== source.sourceSha256) throw Error('ANNUAL_OFFERS_REVISION_MISMATCH');
const actualIds = rows.filter(o=>o.annual).map(o=>o.id).sort();
if (JSON.stringify(actualIds) !== JSON.stringify(source.groups.map((g:{id:string})=>`year:${g.id}`).sort())) throw Error('ANNUAL_OFFERS_IDENTITY_MISMATCH');
annualMosRefreshSchema.parse(registry);
if (old) {
  const expected = ['79281d5eb728e8c026a0d14bdcf2396c0ca1e0fd0e7f180ecec35b6d73894682','a29ae75792d5ebac3c0ce72c852f44eae41d647dd05168c06c78ca19b76caad7','ef03da2353cc3922aef1b2e4bb05017baf234d9a0adf91fe6772bd87d1a596f4'];
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
} else {
  for(const [id,cardId,listingId] of school2103Identities) {
    const card=registry.groups[id];
    if(!card || card.cardId!==cardId || card.listingId!==listingId) throw Error('ANNUAL_MIGRATION_CARD_MISSING');
  }
}
annualMosRefreshSchema.parse(registry);
if(new Set(Object.values(registry.groups).map(g=>(g as {cardId:string}).cardId)).size!==Object.keys(registry.groups).length) throw Error('ANNUAL_MIGRATION_DUPLICATE_CARD');
const action=process.argv[2];
if(!['--write','--check'].includes(action)) throw Error('Choose --write or --check');
if(action==='--check' && old) throw Error('ANNUAL_MIGRATION_REQUIRED');
if(action==='--write' && old){
  const backup=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-school2103-backup-'));
  for(let i=0;i<paths.length;i++){const target=path.join(backup,paths[i]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes[i],{flag:'wx'});}
  const next=[composed,registry,offers].map(v=>JSON.stringify(v,null,2)+'\n');
  // Local operation only, with exact preimages and recovery for partial I/O failure.
  try{for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),next[i]);}
  catch(error){for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(web,paths[i]),bytes[i]);throw error;}
  console.log(JSON.stringify({backup}));
}
console.log(JSON.stringify({action,groups:composed.groups.length,locations:composed.locations.length,sourceSha256:composed.sourceSha256,alreadyImported:!old}));
