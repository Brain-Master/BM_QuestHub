const {test}=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');const {PassThrough}=require('node:stream');
const {nextTick,schedule,runChild,publicResult}=require('./runner.cjs');
test('UTC boundaries, no catch-up after a long run, no overlap, graceful stop',async()=>{
 let clock=299999,active=0,max=0;const starts=[],c=new AbortController();
 await schedule({signal:c.signal,now:()=>clock,wait:async ms=>{clock+=ms;},run:async()=>{max=Math.max(max,++active);starts.push(clock);clock+=starts.length===1?650000:1000;active--;if(starts.length===2)c.abort();return {ok:true};}});
 assert.deepEqual(starts,[302000,1202000]);assert.equal(max,1);assert.equal(nextTick(300000),602000);
});
test('aborting idle worker never launches a job',async()=>{const c=new AbortController();let count=0;await schedule({signal:c.signal,wait:async()=>c.abort(),run:async()=>{count++;}});assert.equal(count,0);});
test('raw handler secrets/errors excluded from public result',()=>{assert.deepEqual(publicResult({statusCode:500,body:JSON.stringify({error:'secret',AWS_SECRET_ACCESS_KEY:'secret',expected:76})}),{statusCode:500,expected:76});});
function fakeSpawn(run){return()=>{const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=s=>run(child,s);setImmediate(()=>run(child));return child;};}
test('only explicit successful child receipt counts as success',async()=>{
 for(const [line,code,ok] of [['BM_RESULT {"statusCode":200,"published":true}\n',0,true],['',0,false],['BM_RESULT {"statusCode":500}\n',0,false],['BM_RESULT {"statusCode":200}\n',1,false]]){
  const r=await runChild('--once',{spawnImpl:fakeSpawn((c,s)=>{if(!s){c.stdout.write(line);c.emit('close',code);}})});assert.equal(r.ok,ok);
 }
});
test('deadline terminates hung child, does not report a successful update',async()=>{
 const signals=[];const r=await runChild('--once',{deadline:10,killGrace:10,spawnImpl:fakeSpawn((c,s)=>{if(s){signals.push(s);if(s==='SIGKILL')c.emit('close',1);}})});assert.deepEqual(signals,['SIGTERM','SIGKILL']);assert.equal(r.error,'WORKER_DEADLINE');
});
