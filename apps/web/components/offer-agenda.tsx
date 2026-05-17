"use client";

import { ScheduleBoard } from "@/components/schedule-board";
import type { AgendaOfferGroup } from "@/lib/offers/agenda";

type Props = {
  groups: AgendaOfferGroup[];
  schoolSlug?: string;
  catalogHref: string;
  allAgendaHref?: string;
  sitesHref?: string;
};

export function OfferAgenda({
  groups,
  schoolSlug,
  catalogHref,
  allAgendaHref,
  sitesHref = "/sites",
}: Props) {
  return (
    <ScheduleBoard
      groups={groups}
      schoolSlug={schoolSlug}
      catalogHref={catalogHref}
      allAgendaHref={allAgendaHref}
      sitesHref={sitesHref}
    />
  );
}
