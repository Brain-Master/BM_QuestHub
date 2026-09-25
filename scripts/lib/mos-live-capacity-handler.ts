import {S3Client,GetObjectCommand,PutObjectCommand} from '@aws-sdk/client-s3';
import {refreshMosAvailability} from './mos-live-capacity';
import {annualMosRefreshSchema} from '../../apps/web/lib/offers/annual-schedule';
import {mosAvailabilitySchema} from '../../apps/web/lib/offers/mos-availability';
import registryInput from '../../apps/web/content/annual-mos-refresh.generated.json';
import {runAvailabilityJob,AVAILABILITY_KEY,LEASE_KEY,OFFERS_KEY} from './mos-live-capacity-store.mjs';

const json=(statusCode:number,body:unknown)=>({statusCode,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
/** Timer/IAM entrypoint only. All HTTP calls denied, including spoofed timer JSON. */
export async function handler(event:Record<string,unknown>={}) {
  if(event.httpMethod || event.requestContext || event.headers || event.body)return json(403,{error:'FORBIDDEN'});
  if(process.env.MOS_AVAILABILITY_ENABLED!=='1')return json(503,{error:'NOT_ENABLED'});
  let client:S3Client|undefined;
  try{
    if(process.env.S3_BUCKET!=='bm-questhub')throw Error('MOS_BUCKET_DENIED');
    const s3=new S3Client({region:'ru-central1',endpoint:'https://storage.yandexcloud.net',maxAttempts:1,
      credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID??'',secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY??''}});
    client=s3;
    const keys=new Set([AVAILABILITY_KEY,LEASE_KEY,OFFERS_KEY]);
    const store={
      async read(key:string){
        if(!keys.has(key))throw Error('MOS_KEY_DENIED');
        try{
          const r=await s3.send(new GetObjectCommand({Bucket:'bm-questhub',Key:key}),{abortSignal:AbortSignal.timeout(10_000)});
          if(!r.Body || !r.ETag || (r.ContentLength??0)>2_000_000)throw Error('MOS_STORAGE_INVALID');
          const chunks:Uint8Array[]=[];let size=0;
          for await(const chunk of r.Body as AsyncIterable<Uint8Array>){size+=chunk.byteLength;if(size>2_000_000)throw Error('MOS_STORAGE_TOO_LARGE');chunks.push(chunk);}
          return {data:JSON.parse(Buffer.concat(chunks).toString('utf8')),etag:r.ETag};
        }catch(e){if((e as {name?:string}).name==='NoSuchKey')return null;throw Error('MOS_STORAGE_READ_FAILED');}
      },
      async put(key:string,data:unknown,etag:string|null){
        if(key!==AVAILABILITY_KEY&&key!==LEASE_KEY)throw Error('MOS_WRITE_DENIED');
        const result=await s3.send(new PutObjectCommand({Bucket:'bm-questhub',Key:key,Body:JSON.stringify(data),
          ACL:key===AVAILABILITY_KEY?'public-read':'private',
          ContentType:'application/json; charset=utf-8',CacheControl:'no-store',
          ...(etag?{IfMatch:etag}:{IfNoneMatch:'*'})}),{abortSignal:AbortSignal.timeout(10_000)});
        if(!result.ETag)throw Error('MOS_WRITE_UNVERIFIED');return result.ETag;
      },
    };
    const identities=annualMosRefreshSchema.parse(registryInput).groups;
    const result=await runAvailabilityJob({store,dryRun:event.dryRun===true,
      refresh:(source:unknown,previous:unknown)=>refreshMosAvailability(source,identities,previous?mosAvailabilitySchema.parse(previous):undefined)});
    const report='result'in result?{dryRun:true,expected:result.result.expected,verified:result.result.verified,errors:result.result.errors.length}:result;
    console.log(JSON.stringify({phase:'mos_availability',...report}));return json(200,report);
  }catch{return json(500,{error:'MOS_AVAILABILITY_RUN_FAILED'});}
  finally{client?.destroy();}
}
