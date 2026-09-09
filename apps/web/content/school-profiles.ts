/** Reviewed public profiles. Stable school/campus IDs are not presentation names. */
type CampusProfile = {address:string; latitude:number; longitude:number; metro?:string; district?:string; mapUrl:string; photoUrl?:string; photoAlt?:string};
type SchoolProfile = {name:string; website?:string; telegram?:string; logoUrl:string; description:string; verifiedAt:string; nameSource:string; preparing?:boolean; campuses:Record<string,CampusProfile>};
export const schoolProfiles: Record<string,SchoolProfile> = {
  "bm-base-moscow": {
    name:"Мехвариум — база BrainMaster",logoUrl:"/sites/bm-base-moscow/mechvarium-mark.svg",preparing:true,
    description:"Готовим к открытию собственную базу BrainMaster «Мехвариум» на Рязанском проспекте, 38. Сейчас идёт ремонт и подготовка пространства. Площадка ещё не открыта, занятия и набор пока не проводятся. О начале работы сообщим отдельно.",
    verifiedAt:"2026-09-09",nameSource:"owner:2026-09-09",
    campuses:{"bm-base-moscow":{address:"Рязанский проспект, 38",latitude:55.71729,longitude:37.78857,district:"Рязанский",mapUrl:"https://yandex.ru/maps/?pt=37.78857,55.71729&z=17&l=map"}},
  },
  "school-1383": {
    name:"ГБОУ города Москвы «Школа № 1383»",website:"https://sch1383.mskobr.ru/",logoUrl:"/sites/school-1383/logo-original.jpg",
    description:"Корпус № 1 школы № 1383 находится на Дубнинской улице, 7. Здесь представлены годовые группы BrainMaster. Выберите программу и год обучения, затем сравните дни и время; точный адрес и ссылка на запись указаны у каждой группы.",
    verifiedAt:"2026-09-09",nameSource:"https://www.mos.ru/upload/documents/files/8595/Prikaz2405202327-08-28523.pdf",
    campuses:{"school-1383-verkhnie-likhobory":{address:"Дубнинская ул., 7",latitude:55.857830,longitude:37.566231,metro:"Верхние Лихоборы",mapUrl:"https://yandex.com/maps/org/shkola_1383_nachalnoye_obrazovaniye_korpus_1/1252310753/",photoUrl:"/sites/school-1383/dubninskaya-7-original.jpg"}},
  },
  "school-1517": {
    name:"ГБОУ города Москвы «Школа № 1517»",website:"https://1517.mskobr.ru/",logoUrl:"/sites/school-1517/logo-original.jpg",
    description:"Корпус № 4 школы № 1517 расположен на улице Тухачевского, 58, корп. 2. Годовые группы BrainMaster на этой странице относятся именно к этому адресу. Сравните доступные дни и время, а перед первым занятием уточните вход и кабинет у организатора.",
    verifiedAt:"2026-09-09",nameSource:"https://www.mos.ru/upload/documents/files/8595/Prikaz2405202327-08-28523.pdf",
    campuses:{"school-1517-narodnoe-opolchenie":{address:"ул. Тухачевского, 58, корп. 2",latitude:55.785725,longitude:37.457653,metro:"Народное Ополчение",mapUrl:"https://yandex.com/maps/org/shkola_1517_korpus_4/114546843084/",photoUrl:"/sites/school-1517/tukhachevskogo-58k2-original.jpg"}},
  },
  "school-2103": {
    name:"ГБОУ города Москвы «Школа № 2103»",website:"https://sch2103uz.mskobr.ru/",logoUrl:"/sites/school-2103/logo-original.jpg",
    description:"Школьное отделение, корпус № 4 школы № 2103, находится на Голубинской улице, 13, корп. 2, в Ясеневе. Страница сохраняет информацию о площадке и её адресе. Наличие занятий BrainMaster проверяйте в расписании ниже: сама карточка площадки не означает открытый набор.",
    verifiedAt:"2026-09-09",nameSource:"https://t.me/school2103",
    campuses:{"school-2103-yasenevo":{address:"Голубинская ул., 13, корп. 2",latitude:55.602950,longitude:37.517538,metro:"Ясенево",district:"Ясенево",mapUrl:"https://yandex.com/maps/org/shkola_2103_shkolnoye_otdeleniye_korpus_4/1021683301/",photoUrl:"/sites/school-2103/golubinskaya-13k2-original.jpg",photoAlt:"Подход к территории корпуса: Голубинская ул., 13, корп. 2"}},
  },
  "school-937": {
    name:"ГБОУ города Москвы «Школа № 937 имени Героя Российской Федерации А. В. Перова»",logoUrl:"/sites/school-937/logo-original.jpg",
    description:"Школа носит имя своего выпускника, Героя Российской Федерации Александра Валентиновича Перова. Представленный корпус находится на улице Маршала Захарова, 25, корп. 2. Сохранённая страница и QR-ссылка ведут к этой площадке; актуальные группы показываются в расписании при их наличии.",
    verifiedAt:"2026-09-09",nameSource:"https://qr.gbumac.ru/qr-person/perov-shkola-937",
    campuses:{"school-937-orekhovo":{address:"ул. Маршала Захарова, 25, корп. 2",latitude:55.619313,longitude:37.701485,metro:"Орехово",mapUrl:"https://yandex.com/maps/org/shkola_937_imeni_geroya_rossiyskoy_federatsii_a_v_perova_korpus_3/123788032512/",photoUrl:"/sites/school-937/zakharova-25k2-original.jpg"}},
  },
  "mduc-ekt": {
    name:"Московский детско-юношеский центр экологии, краеведения и туризма",website:"https://mducekt.mskobr.ru/",logoUrl:"/sites/mduc-ekt/logo-original.jpg",
    description:"Центр дополнительного образования Москвы. На странице представлены два разных адреса: эколого-биологический центр на Одесской улице и подразделение «Станция юных туристов» на Мосфильмовской. Перед поездкой обязательно сверьте корпус; наличие групп BrainMaster указано в расписании, а не определяется по профилю учреждения.",
    verifiedAt:"2026-09-09",nameSource:"https://prodod.moscow/archives/35478",
    campuses:{
      "mduc-ekt-odesskaya":{address:"Одесская ул., 12А",latitude:55.657700,longitude:37.590437,mapUrl:"https://yandex.com/maps/org/moskovskiy_detsko_yunosheskiy_tsentr_ekologii_krayevedeniya_i_turizma/1001378586/",photoUrl:"/sites/mduc-ekt/odesskaya-12a-original.jpg"},
      "mduc-ekt-mosfilmovskaya":{address:"Мосфильмовская ул., 55, корп. 1",latitude:55.702513,longitude:37.495523,mapUrl:"https://yandex.com/maps/org/moskovskiy_detsko_yunosheskiy_tsentr_ekologii_krayevedeniya_i_turizma/144348903354/",photoUrl:"/sites/mduc-ekt/mosfilmovskaya-55k1-original.jpg"},
    },
  },
  "school-17": {
    name: "ГБОУ города Москвы «Школа № 17»", website:"https://sch17uz.mskobr.ru/", telegram:"https://t.me/school17_moscow", logoUrl:"/sites/school-17/logo-original.jpg",
    description:"Образовательный комплекс в районе Коньково. На улице Введенского находятся школьное здание № 2 и отдельный блок начальных классов. Годовые группы BrainMaster из текущего расписания проходят по адресу Введенского, 28, стр. 1. Перед визитом сверьте корпус в карточке группы.",
    verifiedAt:"2026-09-09", nameSource:"https://www.mos.ru/upload/documents/files/5378/1201ot20122023PPEGIA-9.pdf",
    campuses: {
      "school-17-belyaevo":{address:"ул. Введенского, 27А",latitude:55.634305,longitude:37.534509,metro:"Беляево",district:"Коньково",mapUrl:"https://yandex.com/maps/org/shkola_17_shkolnoye_zdaniye_2/1005692174/",photoUrl:"/sites/school-17/vvedenskogo-27a-facade-original.jpg"},
      "school-17-vvedenskogo-28s1":{address:"ул. Введенского, 28, стр. 1",latitude:55.636719,longitude:37.531463,metro:"Беляево",district:"Коньково",mapUrl:"https://yandex.com/maps/org/shkola_17_blok_nachalnykh_klassov/20294205930/",photoUrl:"/sites/school-17/vvedenskogo-28s1-original.jpg"},
    },
  },
  "school-875": {
    name:"ГБОУ города Москвы «Школа № 875»", website:"https://sch875.mskobr.ru/", telegram:"https://t.me/sch_875",logoUrl:"/sites/school-875/logo-original.jpg",
    description:"Образовательный комплекс района Тропарёво-Никулино со школьными и дошкольными корпусами. Адрес годовой группы BrainMaster в текущем расписании — проспект Вернадского, 99, корп. 2. Школьный корпус № 6 по адресу 101, корп. 6 — другой адрес; проверьте место занятия до поездки.",
    verifiedAt:"2026-09-09",nameSource:"https://www.mos.ru/upload/documents/files/9423/232r.pdf",
    campuses:{
      "school-875-yugo-zapadnaya":{address:"проспект Вернадского, 101, корп. 6",latitude:55.663480,longitude:37.489953,metro:"Юго-Западная",district:"Тропарёво-Никулино",mapUrl:"https://yandex.com/maps/org/shkola_875_nachalnoye_osnovnoye_i_sredneye_obrazovaniye_korpus_6/237774459716/",photoUrl:"/sites/school-875/vernadskogo-101k6-original.jpg"},
      "school-875-vernadskogo-99k2":{address:"проспект Вернадского, 99, корп. 2",latitude:55.665473,longitude:37.491217,metro:"Юго-Западная",district:"Тропарёво-Никулино",mapUrl:"https://yandex.com/maps/org/shkola_875_doshkolnyye_gruppy_mir_detstva/1127751671/",photoUrl:"/sites/school-875/vernadskogo-99k2-original.jpg",photoAlt:"Вход на территорию корпуса: проспект Вернадского, 99, корп. 2"},
    },
  },
  "school-1212": {
    name:"ГБОУ города Москвы «Школа № 1212»",website:"https://sch1212.mskobr.ru/",telegram:"https://t.me/mos_sch1212",logoUrl:"/sites/school-1212/logo-original.jpg",
    description:"Образовательный комплекс в районе Ясенево. На странице собраны корпуса на Вильнюсской и Голубинской улицах и Новоясеневском проспекте. Годовые занятия BrainMaster представлены в корпусах на Вильнюсской, 14 и Голубинской, 21, корп. 3: сравните дни и время по каждому адресу.",
    verifiedAt:"2026-09-09",nameSource:"https://www.mos.ru/upload/documents/files/9423/232r.pdf",
    campuses:{
      "school-1212-yasenevo":{address:"Новоясеневский проспект, 24, корп. 3",latitude:55.603857,longitude:37.528669,metro:"Ясенево",district:"Ясенево",mapUrl:"https://yandex.com/maps/org/shkola_1212_korpus_4/1094327654/",photoUrl:"/sites/school-1212/novoyasenevsky-24k3-original.jpg"},
      "school-1212-vilnyusskaya-14":{address:"Вильнюсская ул., 14",latitude:55.598175,longitude:37.516499,metro:"Ясенево",district:"Ясенево",mapUrl:"https://yandex.com/maps/org/shkola_1212_korpus_1/1379281054/",photoUrl:"/sites/school-1212/vilnyusskaya-14-original.jpg"},
      "school-1212-golubinskaya-21k3":{address:"Голубинская ул., 21, корп. 3",latitude:55.601513,longitude:37.527067,metro:"Ясенево",district:"Ясенево",mapUrl:"https://yandex.com/maps/org/shkola_1212_korpus_3/14003409762/",photoUrl:"/sites/school-1212/golubinskaya-21k3-facade-original.jpg"},
    },
  },
  "school-2044": {
    name: "Школа № 2044 имени Героя Советского Союза А. М. Серебрякова",
    website: "https://sch2044sv-new.mskobr.ru/",
    telegram: "https://t.me/sch2044",
    logoUrl: "/sites/school-2044/logo-original.jpg",
    description: "Занятия BrainMaster в двух корпусах на Дмитровском шоссе. Все представленные группы — ШМИ-1, первый год обучения в Школе Молодого IT-Инженера. Сравните дни и время в обоих корпусах и выберите удобный адрес.",
    verifiedAt: "2026-09-09",
    nameSource: "https://www.mos.ru/upload/documents/files/5016/PRIKAZDLYaPYBLIKACIIPr-848.pdf",
    campuses: {
      "school-2044-dmitrovskoe-169b": {
        latitude: 55.932261, longitude: 37.541054,
        address: "Дмитровское шоссе, 169Б", metro: "Физтех", district: "Северный",
        mapUrl: "https://yandex.com/maps/org/school_2044_named_after_a_m_serebryakov/219472700553/",
        photoUrl: "/sites/school-2044/dmitrovskoe-169b-original.jpg",
      },
      "school-2044-dmitrovskoe-165e-k8": {
        latitude: 55.927015, longitude: 37.542641,
        address: "Дмитровское шоссе, 165Е, корп. 8", metro: "Физтех", district: "Северный",
        mapUrl: "https://yandex.com/maps/org/shkola_2044_imeni_geroya_sovetskogo_soyuza_a_m_serebryakova_nachalnoye_obshcheye_obrazovaniye/1115783609/",
        photoUrl: "/sites/school-2044/dmitrovskoe-165e-k8-original.jpg",
      },
    },
  },
};

export function getSchoolProfile(slug: string) {
  return schoolProfiles[slug];
}

export function reviewedCampusProfile(schoolSlug: string, campusSlug: string) {
  const school = getSchoolProfile(schoolSlug);
  if (!school) return {};
  const campus = Object.entries(school.campuses).find(([slug]) => slug === campusSlug)?.[1];
  if (!campus) throw Error(`Unknown reviewed campus: ${campusSlug}`);
  return {
    name: school.name, displayName: school.name, logoUrl: school.logoUrl,
    address: campus.address,
    ...(campus.metro === undefined ? {} : {metro:campus.metro}),
    ...(campus.district === undefined ? {} : {district:campus.district}),
    latitude: campus.latitude, longitude: campus.longitude,
    ...(campus.photoUrl ? {photos:[{ url: campus.photoUrl, alt: campus.photoAlt ?? `${school.name}. ${campus.address}` }]} : school.preparing ? {photos:[]} : {}),
    entranceNote: school.preparing ? "Площадка ещё не открыта: идёт ремонт. Занятий пока нет, посещение не предусмотрено." : "Точка на карте показывает расположение здания. Перед первым занятием уточните у организатора вход и кабинет.",
    directions: school.preparing ? ["Следите за объявлением об открытии Мехвариума в каналах BrainMaster."] : ["Выберите корпус и откройте маршрут по его адресу.", "Уточните вход и кабинет у организатора перед первым занятием."],
    ...(school.preparing ? {contactNote:"О дате открытия и начале занятий сообщим отдельно."} : {}),
  };
}
