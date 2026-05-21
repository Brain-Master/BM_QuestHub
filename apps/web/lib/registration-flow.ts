import siteConfig from "@/data/v2/site-config.json";

import { applyTemplate } from "@/lib/data/template";
import { SCHEDULE_CTA } from "@/lib/offers/schedule-dictionaries";
import type { ScheduleBookingMode } from "@/lib/offers/schedule-board";
import type { LeadFormInput, RegistrationChannel } from "@/lib/schemas";
import { BRAINMASTER_SUPPORT_PHONE } from "@/lib/site-contact";

export type RegistrationFlowKind = "mos_assist" | "waitlist" | "brainmaster";

export type RegistrationFlowContext = {
  kind: RegistrationFlowKind;
  title: string;
  noticeTitle: string;
  noticeText: string;
  submitLabel: string;
  successTitle: string;
  successText: string;
  fallbackTitle?: string;
  fallbackText?: string;
  leadType: LeadFormInput["leadType"];
  registrationChannel: RegistrationChannel;
};

const flowCopy = siteConfig.dictionaries.registrationFlow;
const channelLabels = siteConfig.dictionaries.registrationChannels;

export function getRegistrationChannelLabel(channel: RegistrationChannel): string {
  return channelLabels[channel] ?? channel;
}

function templateVars(channel: RegistrationChannel): Record<string, string> {
  return {
    supportPhone: BRAINMASTER_SUPPORT_PHONE,
    registrationChannel: getRegistrationChannelLabel(channel),
  };
}

function isPreliminaryWaitlist(bookingMode: ScheduleBookingMode): boolean {
  return (
    bookingMode.kind === "waitlist" &&
    bookingMode.label === SCHEDULE_CTA.preliminary
  );
}

export function resolveRegistrationFlow({
  bookingMode,
  registrationChannel,
}: {
  bookingMode: ScheduleBookingMode;
  registrationChannel: RegistrationChannel;
}): RegistrationFlowContext {
  const vars = templateVars(registrationChannel);

  if (bookingMode.kind === "mos") {
    const copy = flowCopy.mosAssist;
    return {
      kind: "mos_assist",
      title: copy.title,
      noticeTitle: copy.noticeTitle,
      noticeText: applyTemplate(copy.noticeText, vars),
      submitLabel: copy.submitLabel,
      successTitle: copy.successTitle,
      successText: copy.successText,
      fallbackTitle: copy.fallbackTitle,
      fallbackText: applyTemplate(copy.fallbackText, vars),
      leadType: "mos_assist",
      registrationChannel: "mos_ru",
    };
  }

  if (bookingMode.kind === "waitlist") {
    const preliminary = isPreliminaryWaitlist(bookingMode);
    const copy = preliminary ? flowCopy.waitlistPreliminary : flowCopy.waitlist;
    return {
      kind: "waitlist",
      title: copy.title,
      noticeTitle: copy.noticeTitle,
      noticeText: applyTemplate(copy.noticeText, vars),
      submitLabel: copy.submitLabel,
      successTitle: copy.successTitle,
      successText: applyTemplate(copy.successText, vars),
      leadType: "waitlist",
      registrationChannel,
    };
  }

  const copy = flowCopy.brainmaster;
  return {
    kind: "brainmaster",
    title: copy.title,
    noticeTitle: copy.noticeTitle,
    noticeText: copy.noticeText,
    submitLabel: copy.submitLabel,
    successTitle: copy.successTitle,
    successText: applyTemplate(copy.successText, vars),
    leadType: "booking",
    registrationChannel,
  };
}
