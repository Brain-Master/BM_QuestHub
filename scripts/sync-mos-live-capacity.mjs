#!/usr/bin/env node
/** Manual read-only acceptance run. No credential loading; never publishes. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.env.TSX_TSCONFIG_PATH=path.join(root,'apps/web/tsconfig.json');
const {require:tsRequire}=await import('tsx/cjs/api');
const {refreshMosAvailability}=tsRequire('./lib/mos-live-capacity.ts',import.meta.url);
const {annualMosRefreshSchema}=tsRequire('../apps/web/lib/offers/annual-schedule.ts',import.meta.url);
const args=process.argv.slice(2);
if(args.some(a=>!a.startsWith('--input=')&&!a.startsWith('--output=')))throw Error('Only --input=<absolute local snapshot> and --output=<new absolute report> are allowed');
const arg=name=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const input=arg('input'),output=arg('output');
if((input&&!path.isAbsolute(input))||(output&&!path.isAbsolute(output)))throw Error('Absolute paths required');
try {
  const registry=annualMosRefreshSchema.parse(JSON.parse(fs.readFileSync(path.join(root,'apps/web/content/annual-mos-refresh.generated.json'),'utf8')));
  let snapshot;
  if(input)snapshot=JSON.parse(fs.readFileSync(input,'utf8'));
  else {
    const response=await fetch('https://storage.yandexcloud.net/bm-questhub/data/offers-snapshot.json',{signal:AbortSignal.timeout(15_000),redirect:'error'});
    if(!response.ok)throw Error('MOS_PUBLISHED_SOURCE_UNAVAILABLE');
    const bytes=await response.arrayBuffer();if(bytes.byteLength>2_000_000)throw Error('MOS_PUBLISHED_SOURCE_TOO_LARGE');
    snapshot=JSON.parse(Buffer.from(bytes).toString('utf8'));
  }
  const result=await refreshMosAvailability(snapshot,registry.groups);
  if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({mode:'read-only',attemptedAt:result.attemptedAt,completedAt:result.completedAt,
    expected:result.expected,verified:result.verified,archived:result.archived,errors:result.errors},null,2));
  process.exitCode=result.errors.length?2:0;
} catch { console.error('MOS_MANUAL_RUN_FAILED');process.exitCode=1; }
