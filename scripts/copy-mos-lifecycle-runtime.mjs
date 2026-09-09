/** Local generated runtime parity only. No deployment or dependency installation. */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const names=["mos-enrolled-plan.mjs","mos-enrolled-batch.mjs","mos-enrolled-sync.mjs","mos-enrolled-finalize.mjs","mos-sync-state.mjs","mos-group-lifecycle.mjs"];
const dirs=["apps/yandex-mos-sync-controller","apps/yandex-mos-sync-planner","apps/yandex-mos-url-worker","apps/yandex-mos-sync-finalizer"];
const targets=dirs.flatMap(dir=>names.map(name=>({dir,name})));
for(const dir of ["apps/yandex-mos-enrolled-sync","apps/yandex-mos-enrolled-sync/bundled/bm-mos-enrolled-sync"]) targets.push({dir,name:"mos-sync-state.mjs"});
const check=process.argv.includes("--check");
for(const {dir,name} of targets){
  const source=path.join(root,"scripts/lib",name), target=path.join(root,dir,name);
  if(!fs.statSync(path.dirname(target)).isDirectory())throw Error("RUNTIME_DIRECTORY_MISSING");
  if(!check)fs.copyFileSync(source,target);
  if(!fs.readFileSync(source).equals(fs.readFileSync(target)))throw Error(`RUNTIME_MISMATCH:${dir}/${name}`);
}
console.log(JSON.stringify({runtimeModules:targets.length,mode:check?"check":"copy",equal:true,deployed:false}));
