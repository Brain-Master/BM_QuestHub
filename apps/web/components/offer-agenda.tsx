"use client";

import { ScheduleBoard } from "@/components/schedule-board";
import type { AgendaOfferGroup } from "@/lib/offers/agenda";

type Props = {
  groups: AgendaOfferGroup[];
  schoolSlug?: string;
  schoolName?: string;
  allAgendaHref?: string;
  sitesHref?: string;
};

export function OfferAgenda({
  groups,
  schoolSlug,
  schoolName,
  allAgendaHref,
  sitesHref = "/sites",
}: Props) {
  return (
    <ScheduleBoard
      groups={groups}
      schoolSlug={schoolSlug}
      schoolName={schoolName}
      allAgendaHref={allAgendaHref}
      sitesHref={sitesHref}
    />
  );
}
