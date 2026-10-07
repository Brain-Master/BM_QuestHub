'use strict';
const http=require('node:http');const fs=require('node:fs');const {randomUUID}=require('node:crypto');
const {LeadStore}=require('./store.cjs');
function createReceiver({store,handler,validate,normalize,origins,bodyLimit=65536}){
 let active=0;const rate=new Map();
 return http.createServer(async(req,res)=>{
  const origin=typeof req.headers.origin==='string'?req.headers.origin:'';
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if(origins.includes(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='POST, OPTIONS';headers['Access-Control-Allow-Headers']='content-type';}
  const reply=(status,data)=>{if(!res.destroyed&&!res.writableEnded){res.writeHead(status,headers);res.end(JSON.stringify(data));}};
  if(req.url==='/health'&&req.method==='GET'){try{store.db.prepare('SELECT 1').get();return reply(200,{ok:true});}catch{return reply(503,{ok:false});}}
  if(req.url!=='/')return reply(404,{ok:false});
  if(req.method==='OPTIONS')return reply(origins.includes(origin)?204:403,{});
  if(req.method!=='POST')return reply(405,{ok:false});
  if(!origins.includes(origin))return reply(403,{ok:false});
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return reply(415,{ok:false});
  if(Number(req.headers['content-length'])>bodyLimit)return reply(413,{ok:false});
  const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').toString().split(',')[0].trim();const now=Date.now();
  let bucket=rate.get(ip);if(!bucket||now-bucket.at>60000){bucket={at:now,count:0};if(rate.size>=1024)rate.delete(rate.keys().next().value);rate.set(ip,bucket);}if(++bucket.count>30||active>=8)return reply(429,{ok:false});
  active++;
  try{
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>bodyLimit){reply(413,{ok:false});return;}chunks.push(chunk);}
   let payload;const body=Buffer.concat(chunks).toString('utf8');try{payload=JSON.parse(body);}catch{return reply(400,{ok:false,error:'Invalid JSON body'});}
   if(payload&&typeof payload==='object'&&Object.hasOwn(payload,'event')){const result=await handler({httpMethod:'POST',headers:req.headers,body},{requestId:randomUUID()});return reply(result.statusCode,JSON.parse(result.body));}
   const result=validate(payload);if(!result.ok)return reply(400,{ok:false,error:'Invalid lead payload'});
   if(payload.submissionId!==undefined&&(typeof payload.submissionId!=='string'||!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(payload.submissionId)))return reply(400,{ok:false,error:'Invalid submission ID'});
   const accepted=store.accept(normalize(payload,''),payload.submissionId);
   return reply(202,{ok:true,...accepted,status:'saved'});
  }catch(e){return reply(e.status===409?409:503,{ok:false,error:e.status===409?'Submission ID conflict':'Unable to save application'});}
  finally{active--;}
 });
}
async function main(){
 process.umask(0o077);
 const config=JSON.parse(fs.readFileSync(process.env.LEAD_CONFIG_FILE||'/run/secrets/receiver.json','utf8'));
 for(const [k,v]of Object.entries(config)){if(typeof v!=='string'||!/^([A-Z][A-Z0-9_]*)$/.test(k))throw Error('INVALID_CONFIG');process.env[k]=v;}
 const receiver=require('../yandex-lead-receiver/index.js');const {startWorker}=require('./delivery.cjs');
 const store=new LeadStore(process.env.LEAD_DB_FILE||'/data/leads.sqlite');
 const origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);if(!origins.length||origins.includes('*'))throw Error('EXPLICIT_ORIGINS_REQUIRED');
 const server=createReceiver({store,handler:receiver.handler,validate:receiver._internals.validateLeadPayload,normalize:receiver._internals.normalizeLead,origins});
 server.requestTimeout=10000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
 server.listen(8080,'0.0.0.0');const stopWorker=startWorker(store);
 let snapshotPending;const snapshot=()=>snapshotPending??=store.backup().catch(()=>console.error('BACKUP_FAILED')).finally(()=>{snapshotPending=undefined;});void snapshot();const backupTimer=setInterval(()=>void snapshot(),3600000);
 let stopping=false;const stop=async()=>{if(stopping)return;stopping=true;clearInterval(backupTimer);await Promise.all([new Promise(resolve=>server.close(resolve)),stopWorker()]);await snapshot();store.close();};process.on('SIGTERM',()=>void stop());process.on('SIGINT',()=>void stop());
 console.info(JSON.stringify({event:'lead.receiver_started'}));
}
if(require.main===module)void main().catch(()=>{console.error('RECEIVER_START_FAILED');process.exitCode=1;});
module.exports={createReceiver};
