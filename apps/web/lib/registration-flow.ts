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
  leadType: LeadFormInput["leadType"];
  registrationChannel: RegistrationChannel;
};

export function getRegistrationChannelLabel(channel: RegistrationChannel): string {
  if (channel === "mos_ru") return "портал mos.ru (договор школы)";
  return "BrainMaster напрямую";
}

export function resolveRegistrationFlow({
  bookingMode,
  registrationChannel,
}: {
  bookingMode: ScheduleBookingMode;
  registrationChannel: RegistrationChannel;
}): RegistrationFlowContext {
  if (bookingMode.kind === "mos") {
    return {
      kind: "mos_assist",
      title: "Перед записью на mos.ru",
      noticeTitle: "Сначала оставьте контакт для поддержки",
      noticeText: `Запись и договор оформляются на портале mos.ru. Сейчас вы оставляете контакты, чтобы мы не потеряли заявку и могли помочь дойти до подписания. Это не бронь места на сайте BrainMaster. Если потребуется помощь, звоните: ${BRAINMASTER_SUPPORT_PHONE}.`,
      submitLabel: "Продолжить к записи на mos.ru",
      leadType: "mos_assist",
      registrationChannel: "mos_ru",
    };
  }

  if (bookingMode.kind === "waitlist") {
    return {
      kind: "waitlist",
      title: "Предварительная заявка",
      noticeTitle: "Это не бронь места",
      noticeText: `Это не бронь места: вы оставляете просьбу уведомить вас, когда откроется запись. Финальное оформление будет проходить через ${getRegistrationChannelLabel(registrationChannel)}.`,
      submitLabel: "Оставить заявку на уведомление",
      leadType: "waitlist",
      registrationChannel,
    };
  }

  return {
    kind: "brainmaster",
    title: "Оформление заявки",
    noticeTitle: "Заявка через BrainMaster",
    noticeText:
      "Мы получим ваши контакты и свяжемся, чтобы подтвердить детали программы и следующий шаг оформления.",
    submitLabel: "Забронировать место",
    leadType: "booking",
    registrationChannel,
  };
}
