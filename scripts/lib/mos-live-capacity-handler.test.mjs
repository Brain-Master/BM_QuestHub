import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Readable} from 'node:stream';
import {AVAILABILITY_KEY,LEASE_KEY,OFFERS_KEY} from './mos-live-capacity-store.mjs';
process.env.TSX_TSCONFIG_PATH=new URL('../../apps/web/tsconfig.json',import.meta.url).pathname;
const {require:tsRequire}=await import('tsx/cjs/api');
const {S3Client,GetObjectCommand,PutObjectCommand}=tsRequire('@aws-sdk/client-s3',import.meta.url);
const {handler}=tsRequire('./mos-live-capacity-handler.ts',import.meta.url);
test('handler applies separate ACLs on creation AND overwrite, CAS and destroys SDK resources',async(t)=>{
 const old={...process.env};t.after(()=>{for(const k of ['MOS_AVAILABILITY_ENABLED','S3_BUCKET','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY']){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}});
 Object.assign(process.env,{MOS_AVAILABILITY_ENABLED:'1',S3_BUCKET:'bm-questhub',AWS_ACCESS_KEY_ID:'synthetic',AWS_SECRET_ACCESS_KEY:'synthetic'});
 t.mock.method(console,'log',()=>{});
 const snapshot=JSON.parse(fs.readFileSync(new URL('../../apps/web/data/offers-snapshot.json',import.meta.url)));
 snapshot.offersByQuest={shmi:snapshot.offersByQuest.shmi.filter(o=>o.id==='year:К1981-26').map(o=>({...o,scheduleCard:{...o.scheduleCard,isArchived:false}}))};
 assert.equal(snapshot.offersByQuest.shmi.length,1);
 const rows=new Map([[OFFERS_KEY,{data:snapshot,etag:'source'}]]),writes=[];let n=0;
 t.mock.method(S3Client.prototype,'send',async command=>{
  const p=command.input;assert.equal(p.Bucket,'bm-questhub');
  if(command instanceof GetObjectCommand){const row=rows.get(p.Key);if(!row)throw Object.assign(Error('missing'),{name:'NoSuchKey'});const bytes=Buffer.from(JSON.stringify(row.data));return {ETag:row.etag,ContentLength:bytes.length,Body:Readable.from([bytes])};}
  assert.ok(command instanceof PutObjectCommand);assert.ok([LEASE_KEY,AVAILABILITY_KEY].includes(p.Key));
  assert.equal(p.ACL,p.Key===LEASE_KEY?'private':'public-read');assert.equal(p.CacheControl,'no-store');
  const current=rows.get(p.Key);if(current)assert.equal(p.IfMatch,current.etag);else assert.equal(p.IfNoneMatch,'*');
  const ETag=`etag${++n}`;rows.set(p.Key,{data:JSON.parse(p.Body),etag:ETag});writes.push(p);return {ETag};
 });
 const destroy=t.mock.method(S3Client.prototype,'destroy',()=>{});
 for(let i=0;i<2;i++){
  const response=await handler({});assert.equal(response.statusCode,200);const report=JSON.parse(response.body);
  assert.equal(report.published,true);assert.equal(report.expected,0);assert.equal(report.leaseReleased,true);
  const lease=rows.get(LEASE_KEY);lease.data.leaseUntil='2000-01-01T00:00:00Z';lease.data.nextDueAt='2000-01-01T00:00:00Z';
 }
 assert.equal(writes.filter(w=>w.Key===AVAILABILITY_KEY).length,2);assert.equal(destroy.mock.callCount(),2);
 assert.equal(rows.get(OFFERS_KEY).etag,'source');
});
