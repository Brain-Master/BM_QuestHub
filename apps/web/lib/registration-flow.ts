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
      title: "Запись через mos.ru",
      noticeTitle: "Сначала закрепим вашу заявку",
      noticeText: `Оставьте контакты, и мы поможем пройти оформление на mos.ru: подскажем по договору, оплате и не дадим заявке потеряться. После отправки откроем портал, а если понадобится помощь, мы на связи: ${BRAINMASTER_SUPPORT_PHONE}.`,
      submitLabel: "Перейти к записи на mos.ru",
      leadType: "mos_assist",
      registrationChannel: "mos_ru",
    };
  }

  if (bookingMode.kind === "waitlist") {
    return {
      kind: "waitlist",
      title: "Заявка в лист ожидания",
      noticeTitle: "Сообщим, когда откроется запись",
      noticeText: `Оставьте контакты, и мы заранее предупредим вас о старте набора. Когда места появятся, подскажем следующий шаг оформления через ${getRegistrationChannelLabel(registrationChannel)}.`,
      submitLabel: "Оставить заявку на уведомление",
      leadType: "waitlist",
      registrationChannel,
    };
  }

  return {
    kind: "brainmaster",
    title: "Оформление заявки",
    noticeTitle: "Закрепим вашу заявку",
    noticeText:
      "Оставьте контакты, и мы свяжемся с вами, чтобы подтвердить место, уточнить детали программы и спокойно довести оформление до конца.",
    submitLabel: "Забронировать место",
    leadType: "booking",
    registrationChannel,
  };
}
