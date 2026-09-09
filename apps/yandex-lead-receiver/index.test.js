"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

const { handler, _internals } = require("./index");

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_CONSOLE_ERROR = console.error;
const ORIGINAL_CONSOLE_WARN = console.warn;
const ORIGINAL_CONSOLE_INFO = console.info;

function upstreamSuccess(url) {
  const body = String(url).includes("oauth2.googleapis.com") ? {access_token:"google-token"}
    : String(url).includes("sheets.googleapis.com") ? {updates:{updatedRows:1}} : {ok:true};
  return Response.json(body);
}

function serviceAccountJson() {
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  return JSON.stringify({
    client_email: "questhub-leads@example.iam.gserviceaccount.com",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
  });
}

function setBaseEnv() {
  process.env = {
    ...ORIGINAL_ENV,
    ALLOWED_ORIGINS: "https://quest.b-master.pro",
    TELEGRAM_BOT_TOKEN: "telegram-token",
    TELEGRAM_CHAT_ID: "telegram-chat",
    GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccountJson(),
    GOOGLE_SHEETS_SPREADSHEET_ID: "spreadsheet-id",
    GOOGLE_LEADS_SHEET_RANGE: "Leads!A:U",
    N8N_WEBHOOK_URL: "https://n8n.example/webhook/lead",
    N8N_TIMEOUT_MS: "1000",
    OPS_REPORT_URL: "https://ops.example/report",
    OPS_REPORT_TOKEN: "ops-secret",
  };
}

function leadPayload(overrides = {}) {
  return {
    leadType: "booking",
    registrationChannel: "brainmaster",
    parentName: "Иван Иванов",
    contact: "+7 999 000-00-00",
    childName: "Петя Иванов",
    childAge: "9",
    comment: "Без аллергий",
    consent: true,
    questSlug: "minecraft-taina-drevnih-inzhenerov",
    questTitle: "Minecraft: Тайна Древних Инженеров",
    offerId: "offer-1",
    variantId: "half-day",
    variantTitle: "Полдня · 09:00",
    venueSlug: "school-1517",
    venueName: "Школа №1517",
    schoolSlug: "school-1517",
    submittedAt: "2026-05-18T10:00:00.000Z",
    source: "bm-questhub-static",
    policyVersion: "2026-05-28",
    consentAt: "2026-05-18T10:00:00.000Z",
    ...overrides,
  };
}

function event(payload, method = "POST") {
  return {
    httpMethod: method,
    headers: { origin: "https://quest.b-master.pro" },
    body: JSON.stringify(payload),
  };
}

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  global.fetch = ORIGINAL_FETCH;
  console.error = ORIGINAL_CONSOLE_ERROR;
  console.warn = ORIGINAL_CONSOLE_WARN;
  console.info = ORIGINAL_CONSOLE_INFO;
});

test("valid lead is sent to Telegram, Google Sheets, and n8n", async () => {
  setBaseEnv();
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    return upstreamSuccess(url);
  };

  const res = await handler(event(leadPayload()), { requestId: "req-1" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.requestId, "req-1");
  assert.equal(body.n8nForwarded, true);
  assert.equal(calls.length, 4);
  assert.ok(calls[0].url.includes("api.telegram.org"));
  assert.ok(calls[1].url.includes("oauth2.googleapis.com"));
  assert.ok(calls[2].url.includes("sheets.googleapis.com"));
  assert.equal(calls[3].url, "https://n8n.example/webhook/lead");
});

test("invalid payload returns 400 and reports to ops only", async () => {
  setBaseEnv();
  const urls = [];
  global.fetch = async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(event(leadPayload({ consent: false })), { requestId: "req-2" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 400);
  assert.equal(body.ok, false);
  assert.deepEqual(body.issues, ["consent must be true"]);
  assert.deepEqual(urls, ["https://ops.example/report"]);
});

test("primary delivery failure returns 502 and skips n8n", async () => {
  setBaseEnv();
  console.error = () => {};
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    if (String(url).includes("sheets.googleapis.com")) {
      return new Response("sheet append failed", { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const res = await handler(event(leadPayload()), { requestId: "req-3" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 502);
  assert.equal(body.ok, false);
  assert.equal(calls.some((call) => call.url === "https://n8n.example/webhook/lead"), false);
  const opsCall = calls.find((call) => call.url === "https://ops.example/report");
  assert.ok(opsCall);
  assert.equal(opsCall.options.headers["x-ops-token"], "ops-secret");
  const opsBody = JSON.parse(opsCall.options.body);
  assert.equal(opsBody.event, "lead.server_error");
  assert.equal(opsBody.errorCode, "delivery_failed");
  assert.equal(opsBody.httpStatus, 502);
});

test("n8n failure does not fail accepted lead", async () => {
  setBaseEnv();
  console.warn = () => {};
  global.fetch = async (url) => {
    if (String(url).includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "google-token" }), { status: 200 });
    }
    if (String(url).includes("n8n.example")) {
      return new Response("automation down", { status: 503 });
    }
    return upstreamSuccess(url);
  };

  const res = await handler(event(leadPayload()), { requestId: "req-4" });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.n8nAttempted, true);
  assert.equal(body.n8nForwarded, false);
});

function stripSpoiler(text) {
  return text.replace(/<tg-spoiler>[\s\S]*<\/tg-spoiler>/, "");
}

test("formatTelegramMessage renders mos_assist lead for humans", () => {
  const lead = _internals.normalizeLead(
    leadPayload({
      leadType: "mos_assist",
      registrationChannel: "mos_ru",
      parentName: "Тестировой Тестян",
      contact: "89999999999",
      childName: "кулебяка",
      childAge: "111",
      questSlug: "mekhvarium-laboratoriya-kineticheskih-monstrov",
      questTitle: "Мехвариум: лаборатория кинетических монстров",
      offerId:
        "sheet:mekhvarium-laboratoriya-kineticheskih-monstrov:school-1212-yasenevo:2026-06-01:2026-06-05:8:30",
      variantTitle: "Полный день · Пн-Пт, 8:30 – 16:30",
      venueSlug: "school-1212-yasenevo",
      venueName: "ГБОУ Школа №1212",
      comment: "Бубубу",
    }),
    "d8573ec0-ab0d-4a69-bd8b-1c8dfef84af7",
  );
  lead.receivedAt = "2026-05-19T00:05:44.044Z";

  const text = _internals.formatTelegramMessage(lead);
  const visible = stripSpoiler(text);

  assert.match(visible, /Запись через mos\.ru/);
  assert.match(visible, /Тестировой Тестян/);
  assert.match(visible, /кулебяка · 111/);
  assert.match(visible, /Мехвариум: лаборатория кинетических монстров/);
  assert.match(visible, /ГБОУ Школа №1212/);
  assert.match(visible, /1–5 июня 2026/);
  assert.match(visible, /Полный день · Пн-Пт, 8:30 – 16:30/);
  assert.match(visible, /Бубубу/);
  assert.match(visible, /МСК/);
  assert.doesNotMatch(visible, /mekhvarium-laboratoriya/);
  assert.doesNotMatch(visible, /sheet:/);
  assert.match(text, /<tg-spoiler>/);
  assert.match(text, /d8573ec0-ab0d-4a69-bd8b-1c8dfef84af7/);
  assert.match(text, /offer: sheet:mekhvarium/);
});

test("formatTelegramMessage renders booking lead title", () => {
  const lead = _internals.normalizeLead(leadPayload(), "req-booking");
  const text = stripSpoiler(_internals.formatTelegramMessage(lead));

  assert.match(text, /Новая заявка на бронирование/);
  assert.doesNotMatch(text, /портал mos\.ru/);
});

test("formatTelegramMessage escapes HTML in user fields", () => {
  const lead = _internals.normalizeLead(
    leadPayload({ comment: "<script>alert(1)</script>" }),
    "req-xss",
  );
  const text = _internals.formatTelegramMessage(lead);

  assert.match(text, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(text, /<script>alert/);
});

test("sheet row contract keeps expected column order", () => {
  const lead = _internals.normalizeLead(leadPayload(), "req-5");
  assert.deepEqual(_internals.leadToSheetRow(lead), [
    lead.receivedAt,
    "2026-05-18T10:00:00.000Z",
    "req-5",
    "booking",
    "brainmaster",
    "Иван Иванов",
    "+7 999 000-00-00",
    "Петя Иванов",
    "9",
    "Minecraft: Тайна Древних Инженеров",
    "minecraft-taina-drevnih-inzhenerov",
    "Школа №1517",
    "school-1517",
    "offer-1",
    "half-day",
    "Полдня · 09:00",
    "school-1517",
    "Без аллергий",
    "bm-questhub-static",
    "2026-05-28",
    "2026-05-18T10:00:00.000Z",
  ]);
});

for (const phase of ["telegram", "google_oauth", "google_sheets"]) {
  for (const hang of ["headers", "body"]) {
    test(`${phase} timeout during ${hang} cancels request/body without retry`, async () => {
      console.info = () => {};
      let calls = 0, aborted = false, cancelled = false, res;
      global.fetch = async (_url, options) => {
        calls++;
        options.signal.addEventListener("abort", () => { aborted = true; }, {once:true});
        if(hang === "headers") return new Promise((_,reject)=>options.signal.addEventListener("abort",()=>reject(Error("PRIVATE_TOKEN")),{once:true}));
        res = new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"unfinished":')); }, cancel() { cancelled = true; } }));
        return res;
      };
      await assert.rejects(_internals.boundedRequest(phase, "https://example.test", {method:"POST"}, _internals.deliveryBudget("req-timeout", 15)), e=>e.code === "upstream_timeout" && e.phase === phase);
      assert.equal(calls,1);assert.equal(aborted,true);
      if(hang === "body"){assert.equal(cancelled,true);await Promise.resolve();assert.equal(res.body.locked,false);}
    });
  }
}

test("shared deadline stops next primary phase, preserving confirmed and not-started outcomes", async () => {
  setBaseEnv();console.info=()=>{};
  const budget=_internals.deliveryBudget("req-budget",1000),calls=[];
  global.fetch=async(url)=>{calls.push(String(url));budget.deadlineAt=Date.now()-1;return upstreamSuccess(url);};
  await assert.rejects(_internals.deliverPrimaryLead(_internals.normalizeLead(leadPayload(),"req-budget"),budget),e=>e.code==="deadline_exceeded"&&e.phase==="google_oauth");
  assert.equal(calls.length,1);assert.equal(budget.progress.telegram,"confirmed");assert.equal(budget.progress.google_sheets,undefined);
});

test("Sheets timeout after confirmed Telegram yields502, unknown append outcome and no retry/n8n", async t => {
  setBaseEnv();const logs=[],calls=[];console.info=s=>logs.push(s);
  t.mock.timers.enable({apis:["setTimeout","Date"],now:Date.parse("2026-09-10T00:00:00Z")});
  let reached;const sheetsStarted=new Promise(r=>{reached=r;});
  global.fetch=async(url,options)=>{calls.push(String(url));if(String(url).includes("sheets.googleapis.com")){reached();return new Promise((_,reject)=>options.signal.addEventListener("abort",()=>reject(Error("PRIVATE_TOKEN")),{once:true}));}return upstreamSuccess(url);};
  const pending=handler(event(leadPayload()),{requestId:"req-partial"});
  await sheetsStarted;t.mock.timers.tick(12000);const res=await pending;
  assert.equal(res.statusCode,502);assert.equal(JSON.parse(res.body).requestId,"req-partial");
  assert.equal(calls.filter(u=>u.includes("sheets.googleapis.com")).length,1);assert.equal(calls.some(u=>u.includes("n8n.example")),false);
  const failure=logs.map(s=>JSON.parse(s)).find(x=>x.event==="lead.delivery_failed");assert.equal(failure.telegram,"confirmed");assert.equal(failure.sheets,"unknown");assert.equal(logs.join("").includes("PRIVATE_TOKEN"),false);
});

test("accepted primary stays200 when n8n stalls; expired optional budget starts no request", async t => {
  setBaseEnv();console.info=()=>{};
  t.mock.timers.enable({apis:["setTimeout","Date"],now:Date.parse("2026-09-10T00:00:00Z")});
  let reached;const n8nStarted=new Promise(r=>{reached=r;});let calls=0;
  global.fetch=async(url,options)=>{calls++;if(String(url).includes("n8n.example")){reached();return new Promise((_,reject)=>options.signal.addEventListener("abort",()=>reject(Error("private")),{once:true}));}return upstreamSuccess(url);};
  const pending=handler(event(leadPayload()),{requestId:"req-optional"});await n8nStarted;t.mock.timers.tick(1000);
  const res=await pending;assert.equal(res.statusCode,200);assert.equal(JSON.parse(res.body).n8nForwarded,false);
  const before=calls;assert.deepEqual(await _internals.forwardLeadToN8n({requestId:"expired"},_internals.deliveryBudget("expired",0)),{attempted:false,ok:false});assert.equal(calls,before);
});

test("upstream error bodies and malformed/missing OAuth tokens never leak or succeed", async () => {
  setBaseEnv();const logs=[];console.info=(...args)=>logs.push(args.join(" "));console.error=console.info;console.warn=console.info;
  for(const failure of ["malformed","no-token","http"]){
    const calls=[];
    global.fetch=async(url)=>{calls.push(String(url));if(String(url).includes("oauth2.googleapis.com"))return new Response(failure==="malformed"?"PRIVATE_PERSON_TOKEN":JSON.stringify({error:"PRIVATE_PERSON_TOKEN"}),{status:failure==="http"?403:200});return upstreamSuccess(url);};
    const res=await handler(event(leadPayload({parentName:"PRIVATE_PARENT"})),{requestId:"req-safe"});assert.equal(res.statusCode,502);assert.equal(calls.some(u=>u.includes("sheets.googleapis.com")),false);
    assert.equal(res.body.includes("PRIVATE"),false);
  }
  assert.equal(logs.join("").includes("PRIVATE"),false);assert.equal(logs.join("").includes("telegram-token"),false);
});

test("bounded response rejects oversized stream; successful requests cancel timers and signal", async () => {
  console.info=()=>{};let signal;
  global.fetch=async(_url,opts)=>{signal=opts.signal;return new Response('x'.repeat(65537));};
  await assert.rejects(_internals.boundedRequest("google_oauth","https://example.test",{},_internals.deliveryBudget()),e=>e.code==="response_too_large");assert.equal(signal.aborted,true);
  global.fetch=async(_url,opts)=>{signal=opts.signal;return Response.json({ok:true});};
  const result=await _internals.boundedRequest("telegram","https://example.test",{},_internals.deliveryBudget(),{validate:j=>j.ok===true});assert.equal(result.status,200);assert.equal(signal.aborted,true);
});

test("annual mos_assist payload and external wire contracts remain compatible", async () => {
  setBaseEnv();console.info=()=>{};const calls=[];
  global.fetch=async(url,options)=>{calls.push({url:String(url),options});return upstreamSuccess(url);};
  const res=await handler(event(leadPayload({leadType:"mos_assist",registrationChannel:"mos_ru",questSlug:"shmi",offerId:"year:К4611-26",venueSlug:"school-1212-vilnyusskaya-14",schoolSlug:"school-1212"})),{requestId:"req-annual"});
  assert.equal(res.statusCode,200);
  assert.equal(JSON.parse(calls[0].options.body).parse_mode,"HTML");
  assert.ok(calls[1].options.body instanceof URLSearchParams);assert.equal(calls[1].options.headers["content-type"],"application/x-www-form-urlencoded");
  const sheets=new URL(calls[2].url);assert.ok(sheets.pathname.endsWith(":append"));assert.equal(sheets.searchParams.get("valueInputOption"),"USER_ENTERED");assert.equal(sheets.searchParams.get("insertDataOption"),"INSERT_ROWS");assert.equal(JSON.parse(calls[2].options.body).values[0].length,21);
  assert.equal((await handler(event({},"OPTIONS"))).statusCode,204);assert.equal((await handler(event({},"GET"))).statusCode,405);
  assert.equal((await handler({httpMethod:"POST",body:"not json"})).statusCode,400);
});

test("primary response beyond old10s runtime succeeds within new shared budget", async t => {
  setBaseEnv();console.info=()=>{};
  t.mock.timers.enable({apis:["setTimeout","Date"],now:Date.parse("2026-09-10T00:00:00Z")});
  let reached;const telegramStarted=new Promise(r=>{reached=r;});
  global.fetch=async(url,options)=>{
    if(String(url).includes("api.telegram.org")){
      reached();return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>resolve(upstreamSuccess(url)),10500);
        options.signal.addEventListener("abort",()=>{clearTimeout(timer);reject(Error("aborted"));},{once:true});
      });
    }
    return upstreamSuccess(url);
  };
  const pending=handler(event(leadPayload()),{requestId:"req-slow-primary"});
  await telegramStarted;t.mock.timers.tick(10500);
  assert.equal((await pending).statusCode,200);
});

test("Telegram HTTP200 with ok:false cannot confirm delivery or start Sheets", async () => {
  setBaseEnv();console.info=()=>{};const calls=[];
  global.fetch=async url=>{calls.push(String(url));return String(url).includes("api.telegram.org")?Response.json({ok:false}):upstreamSuccess(url);};
  assert.equal((await handler(event(leadPayload()))).statusCode,502);
  assert.equal(calls.some(u=>u.includes("googleapis.com")||u.includes("n8n.example")),false);
});

test("Sheets must acknowledge exactly one appended row, not an unrelated HTTP200", async () => {
  setBaseEnv();console.info=()=>{};
  for(const updatedRows of [undefined,0,2,"1"]){
    let n8n=false;
    global.fetch=async url=>{if(String(url).includes("n8n.example"))n8n=true;return String(url).includes("sheets.googleapis.com")?Response.json({updates:{updatedRows}}):upstreamSuccess(url);};
    assert.equal((await handler(event(leadPayload()))).statusCode,502);assert.equal(n8n,false);
  }
});

for(const cutoff of [22000,26000])test(`sequential handler is bounded at ${cutoff}ms across multiple slow phases`,async t=>{
  setBaseEnv();console.info=()=>{};process.env.N8N_TIMEOUT_MS="10000";
  t.mock.timers.enable({apis:["setTimeout","Date"],now:Date.parse("2026-09-10T00:00:00Z")});
  const calls=[];
  global.fetch=async(url,options)=>{
    const u=String(url);calls.push(u);
    const delay=u.includes("api.telegram.org")?11000:u.includes("oauth2.googleapis.com")?10000:0;
    const hang=cutoff===22000?u.includes("sheets.googleapis.com"):u.includes("n8n.example");
    if(!delay&&!hang)return upstreamSuccess(url);
    return new Promise((resolve,reject)=>{
      const timer=hang?null:setTimeout(()=>resolve(upstreamSuccess(url)),delay);
      options.signal.addEventListener("abort",()=>{if(timer)clearTimeout(timer);reject(Error("aborted"));},{once:true});
    });
  };
  let complete=false;const pending=handler(event(leadPayload()),{requestId:"req-total"}).then(r=>{complete=true;return r;});
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  await flush();t.mock.timers.tick(11000);await flush();t.mock.timers.tick(10000);await flush();
  t.mock.timers.tick(cutoff-21000-1);await flush();assert.equal(complete,false);
  t.mock.timers.tick(1);const result=await pending;assert.equal(result.statusCode,cutoff===22000?502:200);
  assert.equal(calls.filter(u=>u.includes("sheets.googleapis.com")).length,1);
  assert.equal(calls.some(u=>u.includes("n8n.example")),cutoff===26000);
});
