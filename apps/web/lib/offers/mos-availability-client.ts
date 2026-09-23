import { mosAvailabilitySchema, reconcileMosAvailability, type MosAvailability } from './mos-availability';

export function mosAvailabilityUrl(offersUrl: string | null): string | null {
  if(!offersUrl)return null;
  const local=offersUrl.startsWith('/');
  const url=new URL(offersUrl,'https://local.invalid');
  // Relative to the actual selected data source, never silently use production in a local preview.
  if(!url.pathname.endsWith('/data/offers-snapshot.json'))return null;
  url.pathname=url.pathname.replace(/data\/offers-snapshot\.json$/,'ops/public/mos-availability.json'); url.search=''; url.hash='';
  return local?url.pathname:url.toString();
}

export function createMosAvailabilityFetcher(fetchImpl:typeof fetch=fetch) {
  let retained:{url:string;snapshot:MosAvailability}|undefined;
  return async (url:string):Promise<MosAvailability>=>{
    const response=await fetchImpl(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10_000),headers:{accept:'application/json'}});
    if(!response.ok)throw Error('MOS_AVAILABILITY_FETCH_FAILED');
    if(!response.headers.get('content-type')?.includes('application/json'))throw Error('MOS_AVAILABILITY_INVALID');
    const reader=response.body?.getReader(); if(!reader)throw Error('MOS_AVAILABILITY_EMPTY');
    let text='';let size=0;const decoder=new TextDecoder();
    try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
      if(size>2_000_000)throw Error('MOS_AVAILABILITY_TOO_LARGE');text+=decoder.decode(value,{stream:true});}}
    finally{await reader.cancel();}
    text+=decoder.decode();
    const incoming=mosAvailabilitySchema.parse(JSON.parse(text));
    const snapshot=reconcileMosAvailability(retained?.url===url?retained.snapshot:undefined,incoming);
    retained={url,snapshot};return snapshot;
  };
}

export const fetchMosAvailabilityClient=createMosAvailabilityFetcher();
