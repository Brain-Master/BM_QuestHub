#!/usr/bin/env node
/** Package ONLY. Intentionally no credential/YC calls; activation requires a reviewed cloud cutover. Existing credentials are reused under owner authority. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {fileURLToPath} from 'node:url';import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.argv.length!==3||process.argv[2]!=='--package')throw Error('PACKAGE_ONLY: --package; cloud activation is not implemented or implied');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-mos-capacity-package-'));
await build({entryPoints:[path.join(root,'scripts/lib/mos-live-capacity-handler.ts')],outfile:path.join(directory,'index.js'),
  bundle:true,platform:'node',target:'node22',format:'cjs',tsconfig:path.join(root,'apps/web/tsconfig.json'),logLevel:'silent'});
fs.writeFileSync(path.join(directory,'runtime.json'),JSON.stringify({functionId:'d4e6lha8cnbtj0f5oaka',triggerId:'a1s5lv4i1tvb46egcg1g',
  cron:'0/5 * * * ? *',runtime:'nodejs22',entrypoint:'index.handler',timeout:'300s',memory:'256m',
  zoneInstancesLimit:1,zoneRequestsLimit:1,concurrency:1,activation:'REQUIRES_REVIEWED_CUTOVER_AND_LIVE_ACCEPTANCE'},null,2));
console.log(JSON.stringify({directory,mode:'package-only',cloudChanged:false}));
