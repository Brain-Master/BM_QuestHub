const website = "https://sch1416sv.mskobr.ru";
const media = "/sites/school-1416";

export const school1416 = {
  slug: "school-1416",
  name: "Школа № 1416 «Лианозово»",
  website: website + "/",
  contactsUrl: website + "/o-nas/kontakty-podrazdelenij",
  informationUrl: website + "/sveden/common",
  accessibilityUrl: website + "/info_edu/support_and_equipment",
  galleryUrl: website + "/o-nas/photo-i-video/photo",
  albumUrl: website + "/showAlbum/30079/40",
  logoUrl: media + "/logo.webp",
  district: "Лианозово",
  metro: "Алтуфьево",
  email: "1416@edu.mos.ru",
  phone: "+7 (499) 200-95-66",
  phoneHref: "tel:+74992009566",
  verifiedAt: "23 ноября 2026",
  description: "Государственная школа в районе Лианозово на северо-востоке Москвы. Рядом метро «Алтуфьево». Здесь собраны адреса восьми зданий школы, фотографии и контакты для родителей.",
  scheduleStatus: "Корпус и расписание занятий BrainMaster уточняются.",
  projects: ["Математическая вертикаль", "Математическая вертикаль ПЛЮС", "Естественно-научная вертикаль"],
  buildings: [
    { slug: "novgorodskaya-8", name: "Главное здание", address: "Новгородская ул., 8", latitude: 55.893442419, longitude: 37.581345899 },
    { slug: "novgorodskaya-12", name: "Корпус № 1", address: "Новгородская ул., 12", latitude: 55.895203541, longitude: 37.581229479 },
    { slug: "novgorodskaya-6", name: "Корпус № 2", address: "Новгородская ул., 6", latitude: 55.8925316805, longitude: 37.5804184055 },
    { slug: "ilimskaya-10k1", name: "Корпус № 3", address: "Илимская ул., 10, корп. 1", latitude: 55.8908222895, longitude: 37.5833836345 },
    { slug: "altufevskoe-87k2", name: "Корпус № 5", address: "Алтуфьевское шоссе, 87, корп. 2", latitude: 55.893328605, longitude: 37.5842879265 },
    { slug: "novgorodskaya-3", name: "Корпус № 6", address: "Новгородская ул., 3", latitude: 55.8924689795, longitude: 37.578798141 },
    { slug: "novgorodskaya-9", name: "Корпус № 7", address: "Новгородская ул., 9", latitude: 55.8954490725, longitude: 37.5779023465 },
    { slug: "altufevskoe-87k4", name: "Корпус № 8", address: "Алтуфьевское шоссе, 87, корп. 4", latitude: 55.8925728, longitude: 37.5842957605 },
  ],
  cover: {
    url: media + "/school-facade.webp",
    alt: "Фасад школы № 1416 «Лианозово» с вывеской над входом",
  },
  photos: [
    { url: media + "/novgorodskaya-12-sign.webp", alt: "Табличка школы № 1416 на остеклённом входе", caption: "Корпус № 1 · Новгородская ул., 12" },
    { url: media + "/school-entrance.webp", alt: "Фасад школьного здания и лестница у входа", caption: "Школьное здание · из официального альбома" },
  ],
};

export const school1416Venue = {
  slug: school1416.slug,
  schoolScopeSlug: school1416.slug,
  preliminaryVenue: true,
  name: school1416.name,
  address: "Корпус занятий уточняется",
  metro: school1416.metro,
  district: school1416.district,
  logoUrl: school1416.logoUrl,
  contactNote: school1416.scheduleStatus,
} as const;
