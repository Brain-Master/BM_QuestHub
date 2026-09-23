import {test,mock} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {AVAILABILITY_KEY,LEASE_KEY} from './mos-live-capacity-store.mjs';
const sent=[],commands=[];
class PutObjectCommand{constructor(input){this.input=input;}}
class DeleteObjectCommand{constructor(input){this.input=input;}}
class ListObjectsV2Command{constructor(input){this.input=input;}}
class S3Client{async send(cmd){sent.push(cmd);return cmd instanceof ListObjectsV2Command?{Contents:[AVAILABILITY_KEY,LEASE_KEY,'old.html'].map(Key=>({Key}))}:{};}}
mock.module('@aws-sdk/client-s3',{namedExports:{PutObjectCommand,DeleteObjectCommand,ListObjectsV2Command,S3Client}});
mock.module('node:fs',{defaultExport:{...fs,existsSync:()=>true,readdirSync:dir=>dir.endsWith('/out')?[{name:'ops',isDirectory:()=>true},{name:'index.html',isDirectory:()=>false,isFile:()=>true}]:dir.endsWith('/ops')?[{name:'public',isDirectory:()=>true},{name:'mos-live-capacity-state.json',isDirectory:()=>false,isFile:()=>true}]:[{name:'mos-availability.json',isDirectory:()=>false,isFile:()=>true}],readFileSync:()=>Buffer.from('synthetic')}});
mock.module('node:child_process',{namedExports:{spawnSync:(command,args)=>{commands.push({command,args});return {status:0};}}});
test('broad SDK and CLI publication neither overwrites nor deletes new availability keys',async()=>{
 const saved=Object.fromEntries(['S3_BUCKET','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY'].map(k=>[k,process.env[k]]));const argv=process.argv;
 try{
  process.env.S3_BUCKET='synthetic-bucket';process.env.AWS_ACCESS_KEY_ID='synthetic';process.env.AWS_SECRET_ACCESS_KEY='synthetic';
  const {runS3SdkSync}=await import('../sync-s3-sdk.mjs');await runS3SdkSync('static');
  assert.equal(sent.filter(c=>c instanceof PutObjectCommand).length,1);assert.equal(sent.find(c=>c instanceof PutObjectCommand).input.Key,'index.html');
  assert.deepEqual(sent.filter(c=>c instanceof DeleteObjectCommand).map(c=>c.input.Key),['old.html']);
  process.argv=['node','sync-s3-public.mjs','static'];await import('../sync-s3-public.mjs');
  await new Promise(resolve=>setImmediate(resolve));
  const call=commands.find(c=>c.command==='aws'&&c.args[1]==='sync');assert.ok(call);assert.ok(call.args.includes('--delete'));
  for(const key of [AVAILABILITY_KEY,LEASE_KEY])assert.equal(call.args[call.args.indexOf(key)-1],'--exclude');
 }finally{process.argv=argv;for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
