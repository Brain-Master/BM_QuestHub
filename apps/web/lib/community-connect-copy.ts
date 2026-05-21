/** Shared copy presets for {@link CommunityConnectPanel}. */

export const communityConnectCopy = {
  questBeforeSchedule: {
    title: "Как это выглядит на смене",
    description:
      "В нашей группе ВКонтакте — сотни фото с прошлых интенсивов: мастерские, финалы, дети с проектами. Загляните в альбомы, прежде чем выбирать смену.",
    emphasis: "community" as const,
  },
  worldBehindScenes: (worldName: string) => ({
    title: "Жизнь мира за кадром",
    description: `В группе BrainMaster во ВКонтакте — фото и видео смен по разным программам, в том числе ${worldName}.`,
    emphasis: "community" as const,
  }),
  siteMorePhotos: {
    title: "Больше фото и впечатлений",
    description:
      "На сайте — согласованные фото входа и кабинета. А в группе ВКонтакте — альбомы с прошлых смен: как проходят занятия, финалы и атмосфера лагеря.",
    emphasis: "community" as const,
    supportNote: "Вопросы по записи на эту площадку",
  },
  agendaNoShift: {
    title: "Не нашли подходящую смену?",
    description:
      "Напишите в Telegram или позвоните — подскажем по датам и записи. А во ВКонтакте можно заранее посмотреть, как проходили прошлые смены.",
    emphasis: "support" as const,
  },
  catalogDoubt: {
    title: "Сомневаетесь, подойдёт ли ребёнку?",
    description:
      "В группе BrainMaster во ВКонтакте — фотоальбомы прошлых смен, отчёты с интенсивов и новости. Присоединяйтесь, чтобы ничего не пропустить.",
    emphasis: "community" as const,
  },
  sitesBeforePick: {
    title: "Перед выбором адреса",
    description:
      "Посмотрите альбомы прошлых смен во ВКонтакте — так проще почувствовать атмосферу BrainMaster.",
    emphasis: "community" as const,
  },
  homeHeroAside: {
    title: "Смены вживую",
    description: "Фотоальбомы прошлых смен и новости — в нашей группе ВКонтакте.",
  },
  footer: {
    title: "BrainMaster на связи",
    description:
      "В группе ВКонтакте — фотоальбомы прошлых смен, отчёты и новости. Присоединяйтесь!",
  },
} as const;
