'use strict';
// Read-only downstream verification. No lead creation or notification.
const fs=require('node:fs');
Object.assign(process.env,JSON.parse(fs.readFileSync('/run/secrets/receiver.json','utf8')));
const {_internals:h}=require('../yandex-lead-receiver/index.js');
const {configured,sheetContains}=require('./delivery.cjs');
(async()=>{
 await h.boundedRequest('telegram_auth',`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`,{},h.deliveryBudget('readiness'),{validate:j=>j?.ok===true});
 await sheetContains({requestId:'readiness-nonexistent-receipt'},h.deliveryBudget('readiness'));
 if(process.env.MAX_BOT_TOKEN)await h.boundedRequest('max_auth','https://platform-api2.max.ru/me',{headers:{Authorization:process.env.MAX_BOT_TOKEN}},h.deliveryBudget('readiness'),{validate:j=>j?.is_bot===true&&String(j.user_id)===process.env.MAX_BOT_ID});
 console.log(JSON.stringify({maxBotVerified:!!process.env.MAX_BOT_TOKEN,telegramReadOnly:true,sheetsReadOnly:true,maxConfigured:configured('max')}));
})().catch(()=>{console.error('DOWNSTREAM_CHECK_FAILED');process.exitCode=1;});
