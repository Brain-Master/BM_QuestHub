// Derive task-owned editorial exports; never modify archive originals.
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const review = resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Provide media-review directory');
const output = resolve('apps/web/public/editorial/year-courses');
await mkdir(output, { recursive: true });
const images = JSON.parse(await readFile(resolve(review, 'images.json'), 'utf8'));
const manifest = [];
for (const [id, name] of [['I008','workshop'],['I100','academy'],['I135','project'],['I174','olympiad'],['I106','electronics']]) {
  const item = images.find(x => x.review_id === id);
  const source = resolve(review, item.file);
  const bytes = await readFile(source);
  if (createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error('Source hash mismatch: ' + id);
  for (const width of [640,1280]) {
    const target = resolve(output, `${name}-${width}.webp`);
    try { await access(target); throw new Error('Refusing to overwrite ' + target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    execFileSync('ffmpeg',['-n','-v','error','-i',source,'-frames:v','1','-vf',`scale=min(${width}\\,iw):-2`,'-quality','82',target]);
  }
  manifest.push({id,name,source:item.asset_id,source_ids:item.source_ids,sha256:item.sha256,description:item.description,rights:'Owner review required before publication'});
}
const videos = JSON.parse(await readFile(resolve(review,'videos.json'),'utf8'));
const video = videos.find(x=>x.review_id==='V01');
// A clearly labelled silent excerpt removes the unverified music track.
execFileSync('ffmpeg',['-n','-v','error','-ss','10','-i',resolve(review,video.file),'-t','30','-vf','scale=960:-2','-an','-c:v','libx264','-crf','27','-preset','fast','-movflags','+faststart',resolve(output,'workshop-excerpt.mp4')]);
execFileSync('ffmpeg',['-n','-v','error','-ss','10','-i',resolve(review,video.file),'-frames:v','1','-vf','scale=960:-2',resolve(output,'video-poster.webp')]);
manifest.push({id:'V01',source:video.asset_id,source_ids:video.source_ids,excerpt_seconds:[10,40],audio:'Removed intentionally; silent process excerpt',rights:'Owner review required before publication'});
await writeFile(resolve(output,'provenance.json'), JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log('Editorial media created in', output);
