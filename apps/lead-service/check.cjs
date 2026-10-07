'use strict';
// Read-only downstream verification. No lead creation or notification.
const fs=require('node:fs');
Object.assign(process.env,JSON.parse(fs.readFileSync('/run/secrets/receiver.json','utf8')));
const {_internals:h}=require('../yandex-lead-receiver/index.js');
const {configured,sheetContains}=require('./delivery.cjs');
(async()=>{
 await h.boundedRequest('telegram_auth',`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`,{},h.deliveryBudget('readiness'),{validate:j=>j?.ok===true});
 await sheetContains({requestId:'readiness-nonexistent-receipt'},h.deliveryBudget('readiness'));
 console.log(JSON.stringify({telegramReadOnly:true,sheetsReadOnly:true,maxConfigured:configured('max')}));
})().catch(()=>{console.error('DOWNSTREAM_CHECK_FAILED');process.exitCode=1;});
