import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire,Module} from 'node:module';
import {build} from 'esbuild';
const root=new URL('../../',import.meta.url).pathname;
const require=createRequire(import.meta.url);
const venues=JSON.parse(fs.readFileSync(root+'apps/web/data/v2/map-snapshot.json')).venues;

test('actual venue loader filters snapshot/YAML and cannot fall back after all venues retired',async()=>{
 for(const mode of ['snapshot','only-retired','yaml']){
  const selected=mode==='only-retired'?venues.filter(v=>v.schoolScopeSlug==='school-875'):venues;
  let yamlReads=0;
  const result=await build({entryPoints:[root+'apps/web/lib/content/load.ts'],bundle:true,write:false,platform:'node',format:'cjs',tsconfig:root+'apps/web/tsconfig.json',logLevel:'silent',plugins:[{name:'read-only-test-ports',setup(b){
   b.onResolve({filter:/^(server-only|node:fs\/promises)$|catalog-snapshot-loader$|site-snapshot-loader$/},args=>({path:args.path,namespace:'test'}));
   b.onLoad({filter:/.*/,namespace:'test'},args=>{
    if(args.path==='server-only')return{contents:'export {}'};
    if(args.path==='node:fs/promises')return{contents:'export default globalThis.__retiredLoaderFs'};
    if(args.path.endsWith('site-snapshot-loader'))return{contents:'export const loadScheduleSnapshotV2=async()=>({events:[]})'};
    return{contents:`export const isStrictRemoteCatalogLoad=()=>false; export const loadMapSnapshot=async()=>(${mode==='yaml'?'null':JSON.stringify({venues:selected})}); export const loadCourseDetailSnapshot=async()=>null; export const loadCoursesFromSnapshot=async()=>null; export const loadWorldsFromSnapshot=async()=>null;`};
   });
  }}]});
  globalThis.__retiredLoaderFs={readdir:async()=>{yamlReads++;return venues.map((_,i)=>`${i}.yaml`);},readFile:async p=>JSON.stringify(venues[Number(p.match(/(\d+)\.yaml$/)[1])])};
  try{
   const m=new Module(root+'scripts/retired-loader-test.cjs');m.filename=root+'scripts/retired-loader-test.cjs';m.paths=require.resolve.paths('yaml');m._compile(result.outputFiles[0].text,m.filename);
   const visible=await m.exports.loadVenues();assert.ok(visible.every(v=>v.schoolScopeSlug!=='school-875'&&!v.slug.startsWith('school-875-')));
   assert.equal(visible.length,mode==='only-retired'?0:venues.length-2);assert.equal(yamlReads,mode==='yaml'?1:0);
  }finally{delete globalThis.__retiredLoaderFs;}
 }
});
