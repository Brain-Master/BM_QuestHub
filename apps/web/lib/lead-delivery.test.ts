import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confirmLeadDelivery, LeadDeliveryError } from './lead-delivery';
test('one POST requires explicit JSON confirmation and never retries',async()=>{
  for(const response of [new Response('{}',{status:502}),new Response('<html/>'),Response.json({ok:false}),Response.json({}),new Response('broken',{headers:{'content-type':'application/json'}})]) {
    let calls=0;
    await assert.rejects(confirmLeadDelivery('https://example.invalid',{}, {fetchImpl:async(_url,init)=>{calls++;assert.equal(init?.method,'POST');assert.equal(init?.redirect,'error');return response;}}));
    assert.equal(calls,1);
  }
  await confirmLeadDelivery('https://example.invalid',{}, {fetchImpl:async()=>Response.json({ok:true,requestId:'test'})});
});
test('hung headers terminate at deadline, abort transport, do not retry',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let signal:AbortSignal|undefined;let calls=0;
  const request=confirmLeadDelivery('https://example.invalid',{}, {timeoutMs:35_000,fetchImpl:async(_url,init)=>{calls++;signal=init?.signal??undefined;return new Promise(()=>{});}});
  const rejection=assert.rejects(request,/UNCONFIRMED/);t.mock.timers.tick(35_000);await rejection;
  assert.equal(signal?.aborted,true);assert.equal(calls,1);
});
test('hung response body also terminates at the same deadline',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let cancelled = false;
  const request=confirmLeadDelivery('https://example.invalid',{}, {fetchImpl:async()=>new Response(new ReadableStream({cancel(){cancelled=true;}}),{headers:{'content-type':'application/json'}})});
  const rejection=assert.rejects(request,/UNCONFIRMED/);await Promise.resolve();t.mock.timers.tick(35_000);await rejection;
  assert.equal(cancelled,true);
});
test('safe HTTP classification survives transport boundary without exposing response body',async()=>{
  await assert.rejects(confirmLeadDelivery('https://example.invalid',{}, {fetchImpl:async()=>new Response('private upstream detail',{status:502})}),e=>e instanceof LeadDeliveryError&&e.errorCode==='delivery_failed'&&e.httpStatus===502&&!e.message.includes('private'));
  await assert.rejects(confirmLeadDelivery('https://example.invalid',{}, {fetchImpl:async()=>new Response('<html/>',{status:200})}),e=>e instanceof LeadDeliveryError&&e.httpStatus===200);
});
test('oversized response cannot create false success',async()=>{
  await assert.rejects(confirmLeadDelivery('https://example.invalid',{}, {fetchImpl:async()=>Response.json({ok:true,padding:'x'.repeat(40_000)})}),/UNCONFIRMED/);
});

test('local booking requires explicit matching reservation; old saved receipt is not a booking',async()=>{
 const payload={offerId:'local-test'};
 for(const result of [{ok:true},{ok:true,reservation:{groupId:'local-test',status:'reserved'}},{ok:true,reservation:{groupId:'other',status:'reserved'}}])await assert.rejects(confirmLeadDelivery('https://example.test',payload,{fetchImpl:async()=>new Response(JSON.stringify(result),{status:202,headers:{'Content-Type':'application/json'}})}));
 await confirmLeadDelivery('https://example.test',payload,{fetchImpl:async()=>new Response(JSON.stringify({ok:true,receiptId:'11111111-1111-4111-8111-111111111111',reservation:{groupId:'local-test',status:'reserved'}}),{status:202,headers:{'Content-Type':'application/json'}})});
 await assert.rejects(confirmLeadDelivery('https://example.test',payload,{fetchImpl:async()=>new Response(JSON.stringify({ok:false,code:'GROUP_FULL'}),{status:409,headers:{'Content-Type':'application/json'}})}),(e:unknown)=>e instanceof LeadDeliveryError&&e.serverCode==='GROUP_FULL');
});
