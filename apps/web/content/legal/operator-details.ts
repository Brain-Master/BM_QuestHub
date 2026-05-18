import { personalDataPolicy, type LegalSection } from "@/content/legal/personal-data-policy";
import {
  BRAINMASTER_LEGAL_EMAIL,
  BRAINMASTER_SUPPORT_PHONE,
} from "@/lib/site-contact";

const operator = personalDataPolicy.operator;

export const operatorDetails = {
  title: "Реквизиты и контакты оператора BrainMaster",
  shortTitle: "Реквизиты и контакты",
  updatedAt: "18 мая 2026",
  operator,
  sections: [
    {
      id: "operator",
      title: "1. Сведения об операторе",
      paragraphs: [
        {
          kind: "list",
          items: [
            `Полное наименование: ${operator.fullName}.`,
            `Краткое наименование: ${operator.shortName}.`,
            `ИНН: ${operator.inn}.`,
            `ОГРНИП: ${operator.ogrnip}.`,
            `Адрес регистрации: ${operator.registrationAddress}.`,
            `Адрес деятельности: ${operator.businessAddress}.`,
          ],
        },
      ],
    },
    {
      id: "contacts",
      title: "2. Контакты",
      paragraphs: [
        {
          kind: "list",
          items: [
            `Телефон для связи: ${BRAINMASTER_SUPPORT_PHONE}.`,
            `Электронная почта для обращений и вопросов по персональным данным: ${BRAINMASTER_LEGAL_EMAIL}.`,
          ],
        },
        "2.1. Эти контакты используются для вопросов по заявкам, предварительной записи, обработке персональных данных и документам сайта BrainMaster Quest Hub.",
      ],
    },
    {
      id: "requests",
      title: "3. Обращения пользователей",
      paragraphs: [
        "3.1. Пользователь может обратиться к Оператору для уточнения информации о программах, статусе заявки, порядке записи через mos.ru или обработке персональных данных.",
        "3.2. Для обращений по персональным данным рекомендуется указать фамилию, имя, контакт для ответа и суть запроса. Оператор может запросить сведения, необходимые для подтверждения полномочий заявителя.",
      ],
    },
  ] satisfies LegalSection[],
};
