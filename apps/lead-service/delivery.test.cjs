'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const {generateKeyPairSync}=require('node:crypto');
const {deliver,sheetContains}=require('./delivery.cjs');const {_internals:h}=require('../yandex-lead-receiver/index.js');
const lead={requestId:'test-receipt',parentName:'Test',childName:'Test',childAge:'9',questTitle:'Test',venueName:'Test',contact:'example.invalid'};
test('real channel transport classifies pre-send failure and ambiguous POST separately',async(t)=>{
 Object.assign(process.env,{TELEGRAM_BOT_TOKEN:'test',TELEGRAM_CHAT_ID:'1',MAX_BOT_TOKEN:'test',MAX_ADMIN_USER_ID:'1'});
 for(const channel of ['telegram','max']){
  let posts=0;
  t.mock.method(global,'fetch',async(_url,options)=>{if(options.method==='POST')posts++;throw Error('network');});
  await assert.rejects(deliver(channel,lead),e=>e.safeRetry===true);assert.equal(posts,0);t.mock.restoreAll();
  t.mock.method(global,'fetch',async(_url,options)=>{if(options.method==='POST'){posts++;throw Error('timeout after possible acceptance');}return Response.json(channel==='telegram'?{ok:true}:{is_bot:true});});
  await assert.rejects(deliver(channel,lead),e=>e.safeRetry===false);assert.equal(posts,1);t.mock.restoreAll();
  t.mock.method(global,'fetch',async(_url,options)=>Response.json(options.method==='POST'?{}:channel==='telegram'?{ok:true}:{is_bot:true}));
  await assert.rejects(deliver(channel,lead),e=>e.safeRetry===false);t.mock.restoreAll();
 }
});
test('uncertain Sheets append reconciles by receipt with no further writes',async(t)=>{
 const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=Buffer.from(JSON.stringify({client_email:'test@example.invalid',private_key:privateKey.export({format:'pem',type:'pkcs8'})})).toString('base64');
 process.env.GOOGLE_SHEETS_SPREADSHEET_ID='test';process.env.GOOGLE_LEADS_SHEET_RANGE='Leads!A:U';
 let appends=0,found=false;
 t.mock.method(global,'fetch',async(url,options)=>{if(String(url).includes('oauth2'))return Response.json({access_token:'test'});if(options.method==='POST'){appends++;throw Error('ambiguous append');}return Response.json({values:found?[[lead.requestId]]:[]});});
 await assert.rejects(deliver('sheets',lead),e=>e.safeRetry===false);assert.equal(appends,1);
 assert.equal(await sheetContains(lead,h.deliveryBudget('test')),false);found=true;
 assert.equal(await sheetContains(lead,h.deliveryBudget('test')),true);assert.equal(appends,1);
});
