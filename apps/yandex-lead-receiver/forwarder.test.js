const {test}=require('node:test');const assert=require('node:assert/strict');const {createForwarder}=require('./forwarder');
test('legacy shim preserves receipt/origin, rejects disallowed origin and never retries uncertain POST',async()=>{
 process.env.ALLOWED_ORIGINS='https://b-master.pro';let calls=0;
 const event={httpMethod:'POST',headers:{origin:'https://b-master.pro'},body:'{"submissionId":"unchanged"}'};
 const handler=createForwarder(async(url,init)=>{calls++;assert.equal(url,'https://space.b-master.pro/api/leads');assert.equal(init.headers.Origin,event.headers.origin);assert.equal(init.body,event.body);return Response.json({ok:true,receiptId:'same'},{status:202});});
 assert.equal((await handler({...event,headers:{origin:'https://evil.invalid'}})).statusCode,403);assert.equal(calls,0);
 assert.equal((await handler(event)).statusCode,202);assert.equal(calls,1);
 const failed=createForwarder(async()=>{calls++;throw Error('secret');});assert.equal((await failed(event)).statusCode,503);assert.equal(calls,2);
});
