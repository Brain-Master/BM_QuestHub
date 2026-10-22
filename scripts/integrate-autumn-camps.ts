/** Reviewed autumn offers. Local generation only; no credentials or network. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import source from '../apps/web/content/autumn-camps-2026.json';
import {getSchoolProfile,reviewedCampusProfile} from '../apps/web/content/school-profiles';
import {questSchema, venueSchema, venueOfferSchema} from '../apps/web/lib/schemas';
import {parseOffersSnapshot} from '../apps/web/lib/offers/snapshot-parse';
import {catalogSnapshotSchema,mapSnapshotSchema,courseDetailSnapshotSchema} from '../apps/web/lib/data/v2/catalog-snapshot';
import {siteManifestV2Schema} from '../apps/web/lib/data/v2/site-snapshot';
import {assertNoPrivateFields} from '../apps/web/lib/data/v2/private-field-denylist';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web=path.join(root,'apps/web');
const encode=(x:unknown)=>JSON.stringify(x,null,2)+'\n';
const hash=(x:unknown)=>'sha256:'+crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(web,p),'utf8'));
const known:Record<string,string>={'autumn-2026-2044-dmitrovskoe-165e-k6':'school-2044-dmitrovskoe-165e-k8','autumn-2026-2103':'school-2103-golubinskaya-5k4','autumn-2026-17-hydraulics':'school-17-belyaevo','autumn-2026-2044-dolgoprudnaya-16':'autumn-2026-2044-dolgoprudnaya-16-venue','autumn-2026-1212':'school-1212-vilnyusskaya-14','autumn-2026-1383':'school-1383-verkhnie-likhobory','autumn-2026-ekt':'mduc-ekt-mosfilmovskaya','autumn-2026-ekt-odesskaya':'mduc-ekt-odesskaya','autumn-2026-ekt-chertanovskaya':'mduc-ekt-chertanovskaya','autumn-2026-37':'school-37-michurinsky-28','autumn-2026-2044-dmitrovskoe-169b':'school-2044-dmitrovskoe-169b'};
const creative='autumn-creative';
export function compileAutumnCamps(input:{offers:ReturnType<typeof read>;catalog:ReturnType<typeof read>;map:ReturnType<typeof read>;manifest:ReturnType<typeof read>}) {
 const {offers,catalog,map,manifest}=structuredClone(input);
 if(!source.publicationEnabled||source.offers.length!==12)throw Error('Autumn source not approved');
 if(parseOffersSnapshot(offers).source==='invalid_file')throw Error('Invalid base offers');
 catalogSnapshotSchema.parse(catalog);mapSnapshotSchema.parse(map);siteManifestV2Schema.parse(manifest);
 const ids=new Set([...source.offers.map(o=>o.id),...source.retiredOfferIds]);if(ids.size!==13)throw Error('Duplicate autumn ID');
 map.venues=map.venues.filter((v:{slug:string;preliminaryVenue?:boolean})=>!(v.preliminaryVenue&&source.offers.some(c=>known[c.id]&&known[c.id]!==v.slug&&v.slug===`${c.id}-venue`)));
 const course=questSchema.omit({offers:true}).parse({slug:creative,worldSlug:'mekhvarium',title:'Инженерно-творческий интенсив',heroImageUrl:'/editorial/year-courses/project-1280.webp',catalogImageUrl:'/editorial/year-courses/project-640.webp',tagline:'Создаём проекты своими руками',ageLabel:'Возраст уточняется по выбранной группе',format:'intensive',skills:['3D-моделирование','проектная работа','творчество'],activeInCampaign:true,durationLabel:'Продолжительность указана у выбранной группы',priceHint:'Стоимость и условия уточняются по выбранной группе',story:'Осенние инженерно-творческие занятия BrainMaster. Программа зависит от школы; смотрите описание выбранной группы.',skillsParent:'Моделирование, сборка и творческая работа в соответствии с программой площадки.',loot:'Результат указан в описании выбранной группы.',approach:'Предварительная регистрация. Условия участия подтверждаем до зачисления.'});
 const ci=catalog.courses.findIndex((c:{slug:string})=>c.slug===creative);if(ci<0)catalog.courses.push(course);else catalog.courses[ci]=course;
 for(const rows of Object.values(offers.offersByQuest) as {id:string}[][])for(let i=rows.length-1;i>=0;i--)if(ids.has(rows[i].id))rows.splice(i,1);
 for(const camp of source.offers){
  const venueSlug=camp.venueSlug??known[camp.id]??`${camp.id}-venue`;
  const official=camp.registrationConfirmed===true;
  if(official&&(!camp.mosBookingUrl||!camp.listingId||!camp.groupCode||!camp.startDate||!camp.endDate||!camp.capacityVerifiedOn||camp.capacity==null||camp.freeSeats==null||camp.freeSeats>camp.capacity))throw Error('Incomplete official camp');
  const school=camp.school==='ЭКТ'?'МДЮЦ ЭКТ':`Школа № ${camp.school}`;
  if(!known[camp.id]){
   const logoUrl=map.venues.find((v:{schoolScopeSlug?:string;logoUrl?:string})=>v.schoolScopeSlug===camp.schoolSlug&&v.logoUrl)?.logoUrl;
   const v=venueSchema.parse({slug:venueSlug,name:school,logoUrl,type:'school',schoolScopeSlug:camp.schoolSlug,preliminaryVenue:true,address:camp.address??'Корпус уточняется',city:'moscow',directions:[],photos:[],listedOnSites:false});
   const i=map.venues.findIndex((v:{slug:string})=>v.slug===venueSlug);if(i<0)map.venues.push(v);else map.venues[i]=v;
  }else if(!map.venues.some((v:{slug:string})=>v.slug===venueSlug)){
   // A cold Sheets reset may omit venues otherwise created by the annual compiler.
   const profile=getSchoolProfile(camp.schoolSlug);if(!profile)throw Error('Missing reviewed school');
   map.venues.push(venueSchema.parse({slug:venueSlug,name:profile.name,type:'school',city:'moscow',schoolScopeSlug:camp.schoolSlug,logoUrl:profile.logoUrl,...(venueSlug==='mduc-ekt-chertanovskaya'?{address:camp.address,directions:[],photos:[]}:reviewedCampusProfile(camp.schoolSlug,venueSlug))}));
  }
  const courseSlug=camp.courseSlug??(camp.school==='1212'?'cyber-rhythm':camp.program==='Мехвариум'||camp.school==='ЭКТ'?'mekhvarium-laboratoriya-kineticheskih-monstrov':creative);
  if(!catalog.courses.some((c:{slug:string})=>c.slug===courseSlug))throw Error('Missing camp course');
  const dates=camp.startDate&&camp.endDate?`${camp.startDate.split('-').reverse().join('.')} — ${camp.endDate.split('-').reverse().join('.')}`:'Даты уточняются';
  const time=camp.startTime&&camp.endTime?`${camp.startTime}–${camp.endTime}`:'Понедельник и вторник, по 2 часа. Время уточняется';
  const price=camp.priceRub===null?'Цена уточняется':`${camp.priceRub.toLocaleString('ru-RU')} ₽${camp.priceProvisional?' · предварительная стоимость':''}`;
  const note=camp.brainmasterOnlyPartOfSchoolIntensive?'BrainMaster проводит только два занятия в рамках школьного интенсива. Указанная стоимость — 9 500 ₽; состав программы и что входит в стоимость уточняются.':'Оставьте предварительную заявку BrainMaster. Мы подтвердим даты, площадку и условия. Заявка не означает зачисление или бронь места.';
  if(official&&(!Number.isFinite(camp.lessonPriceRub)||camp.lessonPriceRub!<=0||!Number.isFinite(camp.priceRub)||camp.priceRub!<=0))throw Error('Invalid official camp price');
  const money=(value:number)=>value.toLocaleString('ru-RU').replace(/\u00a0/g,' ');
  const deadline=camp.admissionEndsAt?` Приём заявлений до ${camp.admissionEndsAt.slice(0,10).split('-').reverse().join('.')} ${camp.admissionEndsAt.slice(11,16)} МСК.`:'';
  const officialNote=official?`Запись и оформление на mos.ru. Код ${camp.listingId}, группа ${camp.groupCode}. Стоимость: ${money(camp.lessonPriceRub!)} ₽ за занятие, ${money(camp.priceRub!)} ₽ за 5 дней.${deadline} Места по данным mos.ru на ${camp.capacityVerifiedOn?.split('-').reverse().join('.')}; актуальное наличие уточняйте в карточке mos.ru.`:note;
  const offer=venueOfferSchema.parse({id:camp.id,...(official?{maxCapacity:camp.capacity,enrolled:camp.capacity!-camp.freeSeats!}:{preliminary:true}),venueSlug,shiftLabel:`${camp.program} · ${school}`,startDate:camp.startDate??'',endDate:camp.endDate??'',startTime:camp.startTime??'',endTime:camp.endTime??'',dateRange:dates,daySchedule:time,priceLabel:price,mosBookingUrl:camp.mosBookingUrl,includedNote:officialNote,sheetStatus:official?'Идет прием':'Скоро старт',scheduleCard:{displayTitle:camp.program,...(official?{teacherName:camp.teacher,mosRuCode:camp.listingId}:{}),description:[camp.description,officialNote].filter(Boolean).join('\n\n'),timelineDate:dates,shortDate:dates,programNameH1:camp.program,programFilterLabel:camp.program,ageLabel:camp.ageMin?`${camp.ageMin}–${camp.ageMax} лет`:'Возраст уточняется',tags:['Осень 2026',official?'Запись на mos.ru':'Предварительная запись'],formatType:camp.brainmasterOnlyPartOfSchoolIntensive?'Два занятия по 2 часа':'Осенний интенсив',formatTime:time,formatNote:officialNote,status:official?'Идет прием':'Скоро старт',registrationChannel:official?'mos_ru':'brainmaster',allowPreliminaryRegistration:!official,variants:[{id:camp.id,type:camp.brainmasterOnlyPartOfSchoolIntensive?'Два занятия по 2 часа':'Осенний интенсив',time,priceLabel:price,...(official?{mosRuCode:camp.listingId,mosBookingUrl:camp.mosBookingUrl,enrolled:camp.capacity!-camp.freeSeats!}:{}),registrationChannel:official?'mos_ru':'brainmaster',allowPreliminaryRegistration:!official,note:officialNote}]}});
  (offers.offersByQuest[courseSlug]??=[]).push(offer);
 }
 const asOf='2026-10-06T10:24:00.000Z';
 for(const o of [offers,catalog,map,manifest])o.generatedAt=o.generatedAt>asOf?o.generatedAt:asOf;
 for(const o of [offers,map,manifest])o.generatedAt=o.generatedAt>'2026-10-17T00:00:00.000Z'?o.generatedAt:'2026-10-17T00:00:00.000Z';
 catalog.integrity={contentHash:hash({worlds:catalog.worlds,courses:catalog.courses})};map.integrity={contentHash:hash({venues:map.venues})};
 manifest.snapshots.catalog.contentHash=catalog.integrity.contentHash;manifest.snapshots.map.contentHash=map.integrity.contentHash;
 const detail={version:2,generatedAt:catalog.generatedAt,source:'reviewed-autumn-camps',course,integrity:{contentHash:hash({course})}};
 if(parseOffersSnapshot(offers).source==='invalid_file')throw Error('Invalid autumn offers');
 catalogSnapshotSchema.parse(catalog);mapSnapshotSchema.parse(map);siteManifestV2Schema.parse(manifest);courseDetailSnapshotSchema.parse(detail);
 const previous=Object.values(input.offers.offersByQuest).flat() as {id:string}[];const next=Object.values(offers.offersByQuest).flat() as {id:string}[];
 for(const row of previous)if(!ids.has(row.id)&&JSON.stringify(row)!==JSON.stringify(next.find(o=>o.id===row.id)))throw Error('Unowned offer changed '+row.id);
 const outputs={'data/offers-snapshot.json':offers,'data/v2/catalog-snapshot.json':catalog,'data/v2/map-snapshot.json':map,'data/v2/site-manifest.json':manifest,'data/v2/detail/autumn-creative.json':detail};
 for(const v of Object.values(outputs))assertNoPrivateFields(v);
 return outputs;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const action=process.argv[2],tier=process.argv.find(a=>a.startsWith('--tier='))?.slice(7)??'all';
 if(!['--write','--check'].includes(action)||!['hot','cold','all'].includes(tier))throw Error('Usage --write|--check --tier=hot|cold|all');
 const outputs=compileAutumnCamps({offers:read('data/offers-snapshot.json'),catalog:read('data/v2/catalog-snapshot.json'),map:read('data/v2/map-snapshot.json'),manifest:read('data/v2/site-manifest.json')});
 for(const [rel,data] of Object.entries(outputs)){if(tier==='hot'&&rel!=='data/offers-snapshot.json'||tier==='cold'&&rel==='data/offers-snapshot.json')continue;
  const p=path.join(web,rel);if(action==='--check'){if(fs.readFileSync(p,'utf8')!==encode(data))throw Error('Autumn drift '+rel);}else{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,encode(data));}}
 console.log(JSON.stringify({action,tier,camps:source.offers.length,preservedUnowned:true}));
}
