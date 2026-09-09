import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const commands=[];
let report={ok:false,verifiedGroups:0,expectedGroups:1,archivedGroups:0};
mock.module('node:child_process',{namedExports:{spawnSync:(cmd,args)=>{commands.push(args);return {status:0}}}});
mock.module('../load-dotenv.mjs',{namedExports:{loadRepoEnv:()=>'/synthetic-no-credentials'}});
mock.module('node:fs',{defaultExport:{...fs,readFileSync:file=>{assert.match(file,/annual-mos-refresh.generated.json$/);return JSON.stringify(report)}}});
test('safe publication followed by incomplete annual coverage returns failure, including zero legacy work',async()=>{
  const old=process.exitCode;
  try {
    process.exitCode=0;
    await import('../publish-sheet-hot.mjs?partial');
    assert.equal(process.exitCode,1);assert.equal(commands.length,4);
    report={ok:true,verifiedGroups:0,expectedGroups:1,archivedGroups:1};process.exitCode=0;
    await import('../publish-sheet-hot.mjs?archived');
    assert.equal(process.exitCode,0);assert.equal(commands.length,8);
  } finally {process.exitCode=old;}
});
