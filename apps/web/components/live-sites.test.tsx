import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SWRConfig} from 'swr';
import {SearchParamsContext, PathnameContext} from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import {LiveSites} from './live-sites';
import {questSchema, venueSchema, worldSchema} from '../lib/schemas';
import {publicOffersSnapshotUrl} from '../lib/offers/snapshot-client';

const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read('data/v2/catalog-snapshot.json');
const hot=read('data/offers-snapshot.json');
const venues=venueSchema.array().parse(read('data/v2/map-snapshot.json').venues);
const worlds=worldSchema.array().parse(catalog.worlds);

for(const scenario of ['loading-unknown','error-unknown','ready-empty','error-cached-empty','error-baseline']){
  test(`site availability distinguishes unknown from zero: ${scenario}`,()=>{
    const baseQuests=questSchema.array().parse(catalog.courses.map((q:{slug:string})=>({...q,offers:scenario==='error-baseline'?hot.offersByQuest[q.slug]??[]:[]})));
    const error=scenario.startsWith('error');
    const emptyKnown=scenario==='ready-empty'||scenario==='error-cached-empty';
    const cache=new Map();
    if(error||emptyKnown)cache.set(publicOffersSnapshotUrl(),{
      error:error?new Error('fixture unavailable'):undefined,
      data:emptyKnown?{...hot,offersByQuest:{}}:undefined,
      isLoading:false,isValidating:false,
    });
    const html=renderToStaticMarkup(
      <SWRConfig value={{provider:()=>cache}}>
        <PathnameContext.Provider value="/sites/">
          <SearchParamsContext.Provider value={new URLSearchParams('view=grid')}>
            <LiveSites baseQuests={baseQuests} venues={venues} worlds={worlds}/>
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </SWRConfig>,
    );
    const unknown=scenario.endsWith('unknown');
    assert.equal(html.includes('Данные о группах пока недоступны'),unknown);
    assert.equal(html.includes('Не удалось обновить расписание'),error);
    assert.equal(html.includes('Загружаем актуальное'),scenario==='loading-unknown');
    assert.equal((html.match(/<article[^>]*data-inactive="true"/g)??[]).length,unknown?0:emptyKnown?10:4);
    if(unknown)assert.equal(html.includes('Сейчас нет групп'),false);
  });
}
