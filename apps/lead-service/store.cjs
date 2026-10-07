'use strict';
const {DatabaseSync,backup}=require('node:sqlite');
const {createHash,randomUUID}=require('node:crypto');
const fs=require('node:fs');const path=require('node:path');
const ignored=new Set(['requestId','receivedAt','submittedAt','consentAt']);
function payloadHash(lead){return createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(lead).filter(([k])=>!ignored.has(k)).sort(([a],[b])=>a.localeCompare(b))))).digest('hex');}
class LeadStore {
 constructor(file){this.file=file;this.db=new DatabaseSync(file);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, submission_id TEXT NOT NULL UNIQUE, payload_hash TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS jobs(receipt_id TEXT NOT NULL REFERENCES receipts(id), channel TEXT NOT NULL, state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL DEFAULT 0, error_code TEXT, PRIMARY KEY(receipt_id,channel));
 CREATE INDEX IF NOT EXISTS jobs_due ON jobs(channel,state,next_at);
 UPDATE jobs SET state='uncertain', error_code='PROCESS_RESTART', next_at=0 WHERE state='sending';`);if(file!==':memory:')fs.chmodSync(file,0o600);}
 accept(lead,submissionId){const hash=payloadHash(lead);this.db.exec('BEGIN IMMEDIATE');try{
  // Legacy open tabs have no submission ID. Deduplicate identical payloads for 24h.
  const id=submissionId||`legacy:${randomUUID()}`;
  const prior=submissionId?this.db.prepare('SELECT id,payload_hash FROM receipts WHERE submission_id=?').get(id):this.db.prepare('SELECT id,payload_hash FROM receipts WHERE payload_hash=? AND created_at>=? ORDER BY created_at DESC LIMIT 1').get(hash,Date.now()-86400000);
  if(prior){if(prior.payload_hash!==hash)throw Object.assign(new Error('IDEMPOTENCY_CONFLICT'),{status:409});this.db.exec('COMMIT');return {receiptId:prior.id,duplicate:true};}
  const receiptId=randomUUID();const saved={...lead,requestId:receiptId};
  this.db.prepare('INSERT INTO receipts VALUES (?,?,?,?,?)').run(receiptId,id,hash,JSON.stringify(saved),Date.now());
  for(const channel of ['sheets','telegram','max'])this.db.prepare("INSERT INTO jobs(receipt_id,channel,state) VALUES (?,?,'pending')").run(receiptId,channel);
  this.db.exec('COMMIT');return {receiptId,duplicate:false};
 }catch(e){try{this.db.exec('ROLLBACK');}catch{}throw e;}}
 configured(channel,enabled){this.db.prepare(enabled?"UPDATE jobs SET state='pending',next_at=0 WHERE channel=? AND state='not_configured'":"UPDATE jobs SET state='not_configured' WHERE channel=? AND state IN ('pending','retry')").run(channel);}
 claim(channel){this.db.exec('BEGIN IMMEDIATE');try{const row=this.db.prepare("SELECT j.*,r.payload FROM jobs j JOIN receipts r ON r.id=j.receipt_id WHERE channel=? AND state IN ('pending','retry') AND next_at<=? ORDER BY r.created_at LIMIT 1").get(channel,Date.now());if(row)this.db.prepare("UPDATE jobs SET state='sending',attempts=attempts+1 WHERE receipt_id=? AND channel=?").run(row.receipt_id,channel);this.db.exec('COMMIT');return row?{...row,attempts:row.attempts+1,lead:JSON.parse(row.payload)}:null;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 finish(job,state,code=''){const delay=state==='retry'?Math.min(3600000,15000*2**Math.min(job.attempts,8)):600000;this.db.prepare('UPDATE jobs SET state=?,error_code=?,next_at=? WHERE receipt_id=? AND channel=?').run(state,code,Date.now()+delay,job.receipt_id,job.channel);}
 uncertainSheet(){const row=this.db.prepare("SELECT j.*,r.payload FROM jobs j JOIN receipts r ON r.id=j.receipt_id WHERE channel='sheets' AND state='uncertain' AND next_at<=? LIMIT 1").get(Date.now());return row?{...row,lead:JSON.parse(row.payload)}:null;}
 summary(){return this.db.prepare('SELECT channel,state,count(*) AS count FROM jobs GROUP BY channel,state').all();}
 async backup(){if(this.file===':memory:')return;const folder=path.join(path.dirname(this.file),'backups');fs.mkdirSync(folder,{recursive:true,mode:0o700});const target=path.join(folder,`leads-${new Date().toISOString().slice(0,10)}.sqlite`);if(fs.existsSync(target))return;const temp=target+'.tmp';await backup(this.db,temp);fs.chmodSync(temp,0o600);fs.renameSync(temp,target);const names=fs.readdirSync(folder).filter(n=>/^leads-\d{4}-\d{2}-\d{2}\.sqlite$/.test(n)).sort();for(const n of names.slice(0,-7))fs.unlinkSync(path.join(folder,n));}
 close(){this.db.close();}
}
module.exports={LeadStore,payloadHash};
