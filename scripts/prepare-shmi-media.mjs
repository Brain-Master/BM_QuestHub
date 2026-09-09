// Add a new editorial revision. Never overwrite archive originals or previous exports.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
if(!process.argv[2])throw Error('Provide reviewed media directory');
const review=resolve(process.argv[2]),output=resolve('apps/web/public/editorial/year-courses');
const entries=JSON.parse(await readFile(resolve(review,'images.json'),'utf8'));
const item=entries.find(x=>x.review_id==='I011');
if(!item)throw Error('Missing I011');
const source=resolve(review,item.file),bytes=await readFile(source);
if(createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Source hash mismatch');
await mkdir(output,{recursive:true});
const exports=[];
for(const width of [640,1280]) {
 const file=`shmi-robot-${width}.webp`,target=resolve(output,file);
 execFileSync('ffmpeg',['-n','-v','error','-i',source,'-frames:v','1','-vf',`scale=${width}:-2`,'-quality','85',target]);
 const exported=await readFile(target);
 exports.push({file,sha256:createHash('sha256').update(exported).digest('hex')});
}
await writeFile(resolve(output,'shmi-robot.provenance.json'),JSON.stringify({reviewId:'I011',source:item.asset_id,sourceIds:item.source_ids,sourceSha256:item.sha256,description:item.description,exports,selection:'Real workshop robot; clear in compact cards; no identifiable faces. Illustrates the programme, not a promise about a specific group.',publication:'Selected from owner-supplied archive under owner website publication request; independent rights audit not performed.'},null,2)+'\n',{flag:'wx'});
console.log('Created SHMI robot revision and provenance');
