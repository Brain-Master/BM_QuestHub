'use strict';
// Compatibility for already-open pages. The VPS is the only lead writer.
const ENDPOINT='https://space.b-master.pro/api/leads';
function createForwarder(request=fetch){return async(event)=>{
 const origin=event.headers?.origin||event.headers?.Origin||'';
 const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(allowed.includes(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type'});
 const reply=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
 if(!allowed.includes(origin))return reply(403,{ok:false});
 if(event.httpMethod==='OPTIONS')return reply(204,{});
 if(event.httpMethod!=='POST')return reply(405,{ok:false});
 const body=event.isBase64Encoded?Buffer.from(event.body||'','base64').toString('utf8'):event.body||'';
 if(Buffer.byteLength(body)>65536)return reply(413,{ok:false});
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await request(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body,signal:controller.signal,redirect:'error'});
  if(!response.headers.get('content-type')?.includes('application/json'))throw Error('INVALID_RESPONSE');
  const reader=response.body.getReader();let size=0;const chunks=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32768)throw Error('RESPONSE_LIMIT');chunks.push(Buffer.from(value));}}finally{void reader.cancel().catch(()=>{});}
  const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  return reply(response.status,result);
 }catch{return reply(503,{ok:false,error:'Delivery unconfirmed'});}finally{clearTimeout(timer);controller.abort();}
};}
exports.handler=createForwarder();exports.createForwarder=createForwarder;
