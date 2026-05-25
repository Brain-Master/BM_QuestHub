"use client";

import { ScheduleBoard } from "@/components/schedule-board";
import type { AgendaOfferGroup } from "@/lib/offers/agenda";

type Props = {
  groups: AgendaOfferGroup[];
  schoolSlug?: string;
  schoolName?: string;
  allAgendaHref?: string;
  sitesHref?: string;
  snapshotGeneratedAt?: string | null;
  showSnapshotTime?: boolean;
  hideTitle?: boolean;
  hideCommunityPanel?: boolean;
};

export function OfferAgenda({
  groups,
  schoolSlug,
  schoolName,
  allAgendaHref,
  sitesHref = "/sites",
  snapshotGeneratedAt = null,
  showSnapshotTime = false,
  hideTitle = false,
  hideCommunityPanel = false,
}: Props) {
  return (
    <ScheduleBoard
      groups={groups}
      schoolSlug={schoolSlug}
      schoolName={schoolName}
      allAgendaHref={allAgendaHref}
      sitesHref={sitesHref}
      snapshotGeneratedAt={snapshotGeneratedAt}
      showSnapshotTime={showSnapshotTime}
      hideTitle={hideTitle}
      hideCommunityPanel={hideCommunityPanel}
    />
  );
}
