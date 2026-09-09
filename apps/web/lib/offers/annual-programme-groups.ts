import type { ScheduleBoardItem } from "./schedule-board";

export type AnnualProgrammeGroup = {
  slug: string;
  title: string;
  imageUrl?: string;
  campuses: { slug: string; schoolSlug: string; name: string; address: string; items: ScheduleBoardItem[] }[];
};

/** Identity comes from the catalogue, never a school-authored display title. */
export function groupAnnualProgrammes(items: ScheduleBoardItem[]): AnnualProgrammeGroup[] {
  const programmes = new Map<string, AnnualProgrammeGroup>();
  for(const item of items) {
    if(item.quest.format !== "year") continue;
    let programme=programmes.get(item.quest.slug);
    if(!programme) {
      programme={slug:item.quest.slug,title:item.quest.title,imageUrl:item.quest.heroImageUrl,campuses:[]};
      programmes.set(item.quest.slug,programme);
    }
    let campus=programme.campuses.find(c=>c.slug===item.offer.venueSlug);
    if(!campus) {
      campus={slug:item.offer.venueSlug,schoolSlug:item.venue.schoolScopeSlug??item.venue.slug,name:item.venue.name,address:item.venue.address,items:[]};
      programme.campuses.push(campus);
    }
    campus.items.push(item);
  }
  return [...programmes.values()].map(p=>({...p,campuses:p.campuses.sort((a,b)=>a.name.localeCompare(b.name,"ru")||a.address.localeCompare(b.address,"ru"))}));
}
