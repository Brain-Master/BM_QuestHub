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
  leadType: LeadFormInput["leadType"];
  registrationChannel: RegistrationChannel;
};

export function getRegistrationChannelLabel(channel: RegistrationChannel): string {
  if (channel === "mos_ru") return "портал mos.ru (договор школы)";
  return "BrainMaster напрямую";
}

function isPreliminaryWaitlist(bookingMode: ScheduleBookingMode): boolean {
  return (
    bookingMode.kind === "waitlist" &&
    bookingMode.label === "Предварительная заявка"
  );
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
      successTitle: "Спасибо за заявку",
      successText:
        "Контакты сохранены. Дальше оформите запись на mos.ru — мы на связи, если понадобится помощь.",
      leadType: "mos_assist",
      registrationChannel: "mos_ru",
    };
  }

  if (bookingMode.kind === "waitlist") {
    const preliminary = isPreliminaryWaitlist(bookingMode);
    return {
      kind: "waitlist",
      title: preliminary
        ? "Предварительная заявка"
        : "Заявка в лист ожидания",
      noticeTitle: preliminary
        ? "Сообщим, когда откроется запись"
        : "Сообщим, если освободится место",
      noticeText: preliminary
        ? `Оставьте контакты, и мы заранее предупредим вас о старте набора. Когда места появятся, подскажем следующий шаг оформления через ${getRegistrationChannelLabel(registrationChannel)}.`
        : `Оставьте контакты — это не бронь места. Если кто-то откажется, мы свяжемся с вами и подскажем, как оформить участие через ${getRegistrationChannelLabel(registrationChannel)}.`,
      submitLabel: "Оставить заявку на уведомление",
      successTitle: preliminary ? "Заявка принята" : "Вы в листе ожидания",
      successText: preliminary
        ? `Мы сохранили ваши контакты и напишем или позвоним, когда откроется запись. Это не бронь места. Вопросы — ${BRAINMASTER_SUPPORT_PHONE}.`
        : `Мы сохранили ваши контакты. Если освободится место, свяжемся с вами в порядке очереди. Вопросы — ${BRAINMASTER_SUPPORT_PHONE}.`,
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
    successTitle: "Заявка отправлена",
    successText: `Мы получили ваши контакты и свяжемся с вами, чтобы подтвердить место и детали программы. Если вопрос срочный — ${BRAINMASTER_SUPPORT_PHONE}.`,
    leadType: "booking",
    registrationChannel,
  };
}
