'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const INTERVAL=300_000,DEADLINE=290_000;
const HEALTH='/tmp/mos-capacity-health.json';
const nextTick=now=>(Math.floor(now/INTERVAL)+1)*INTERVAL+2000;
function sleep(ms,signal){return new Promise(resolve=>{if(signal.aborted)return resolve();const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();};const timer=setTimeout(done,ms);signal.addEventListener('abort',done,{once:true});});}
function verifyFiles(directory){
 const manifest=JSON.parse(fs.readFileSync(directory+'/manifest.json'));
 for(const name of ['index.js','runner.cjs']){
  if(!/^[a-f0-9]{64}$/.test(manifest.files?.[name]??'')||crypto.createHash('sha256').update(fs.readFileSync(directory+'/'+name)).digest('hex')!==manifest.files[name])throw Error('WORKER_INTEGRITY');
 }
}
function publicResult(response){
 const body=JSON.parse(response.body);const result={statusCode:response.statusCode};
 for(const key of ['published','dryRun','expected','verified','errors','complete','leaseReleased','skipped','completedAt']){
  const value=body[key];if(value!==undefined&&(typeof value==='string'||typeof value==='boolean'||Number.isSafeInteger(value)))result[key]=value;
 }
 return result;
}
function runChild(mode,{spawnImpl=spawn,deadline=DEADLINE,killGrace=10_000,directory=__dirname}={}){
 return new Promise(resolve=>{
  const child=spawnImpl(process.execPath,[directory+'/runner.cjs',mode],{stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH??'/usr/local/bin:/usr/bin:/bin',NODE_ENV:'production'}});
  let output='',bytes=0,timedOut=false,killTimer,settled=false;
  const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');killTimer=setTimeout(()=>child.kill('SIGKILL'),killGrace);},deadline);
  const finish=(code)=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(killTimer);let result;
   try{const line=output.split('\n').findLast(l=>l.startsWith('BM_RESULT '));result=JSON.parse(line.slice(10));}catch{}
   resolve(!timedOut&&code===0&&result?.statusCode===200?{ok:true,...result}:{ok:false,error:timedOut?'WORKER_DEADLINE':'WORKER_CHILD_FAILED'});
  };
  child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>65536){timedOut=true;child.kill('SIGKILL');}else output+=chunk.toString();});
  child.stderr.on('data',()=>{}); // Never forward SDK/raw stderr or environment to logs.
  child.on('error',()=>finish(1));child.on('close',finish);
 });
}
async function schedule({run,signal,now=Date.now,wait=sleep,health=()=>{},log=()=>{}}){
 health({state:'waiting',at:now()});
 while(!signal.aborted){
  await wait(Math.max(0,nextTick(now())-now()),signal);if(signal.aborted)break;
  health({state:'running',at:now()});
  let result;try{result=await run();}catch{result={ok:false,error:'WORKER_CHILD_FAILED'};}
  log(result);health({state:'waiting',at:now(),ok:result.ok});
 }
}
async function main(){
 const mode=process.argv[2];
 if(mode==='--health'){const h=JSON.parse(fs.readFileSync(HEALTH));if(!Number.isFinite(h.at)||Date.now()-h.at>360_000||Date.now()<h.at)throw Error('WORKER_HEALTH_STALE');return;}
 verifyFiles(__dirname);
 if(mode==='--once'||mode==='--dry-run'){
  const config=JSON.parse(fs.readFileSync('/run/secrets/mos-s3.json'));
  const keys=['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','MOS_AVAILABILITY_ENABLED','S3_BUCKET'];
  if(Object.keys(config).sort().join(',')!==keys.sort().join(',')||config.S3_BUCKET!=='bm-questhub'||config.MOS_AVAILABILITY_ENABLED!=='1')throw Error('WORKER_CONFIG');
  for(const key of keys){if(typeof config[key]!=='string'||!config[key]||config[key].length>1000||/[\r\n]/.test(config[key]))throw Error('WORKER_CONFIG');process.env[key]=config[key];}
  const result=publicResult(await require('./index.js').handler(mode==='--dry-run'?{dryRun:true}:{}));
  process.stdout.write('BM_RESULT '+JSON.stringify(result)+'\n');process.exitCode=result.statusCode===200?0:1;return;
 }
 if(mode==='--probe'){const result=await runChild('--dry-run');process.stdout.write('BM_PROBE '+JSON.stringify(result)+'\n');process.exitCode=result.ok?0:1;return;}
 if(mode!=='--schedule')throw Error('WORKER_MODE');
 const controller=new AbortController();for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>controller.abort());
 await schedule({signal:controller.signal,run:()=>runChild('--once'),health:value=>{fs.writeFileSync(HEALTH+'.tmp',JSON.stringify(value),{mode:0o600});fs.renameSync(HEALTH+'.tmp',HEALTH);},log:value=>process.stdout.write(JSON.stringify({phase:'mos_capacity_cycle',at:new Date().toISOString(),...value})+'\n')});
}
module.exports={nextTick,schedule,runChild,publicResult,verifyFiles};
if(require.main===module)main().then(()=>process.exit(process.exitCode??0)).catch(()=>{process.stderr.write('WORKER_FAILED\n');process.exit(1);});
