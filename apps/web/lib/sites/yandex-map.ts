import type { SiteCampus } from "@/lib/sites/scope-card";

type BuildYandexMapParams = {
  siteName: string;
  campuses: SiteCampus[];
};

const CAMPUS_MARKER_STYLES = ["pm2rdm", "pm2blm", "pm2orgl", "pm2grm"] as const;

function buildMapQuery(siteName: string, campus: SiteCampus): string {
  return [
    siteName,
    campus.address,
    campus.metro && campus.metro !== "—" ? `м. ${campus.metro}` : undefined,
  ]
    .filter(Boolean)
    .join(", ");
}

function campusesWithCoordinates(campuses: SiteCampus[]): SiteCampus[] {
  return campuses.filter(
    (campus) =>
      typeof campus.latitude === "number" && typeof campus.longitude === "number",
  );
}

function computeMapView(mappedCampuses: SiteCampus[]): { ll: string; z: string } {
  const latitudes = mappedCampuses.map((campus) => campus.latitude!);
  const longitudes = mappedCampuses.map((campus) => campus.longitude!);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const span = Math.max(maxLat - minLat, maxLng - minLng);

  let z = 15;
  if (span > 0.15) z = 11;
  else if (span > 0.08) z = 12;
  else if (span > 0.04) z = 13;
  else if (span > 0.02) z = 14;

  return {
    ll: `${centerLng},${centerLat}`,
    z: String(z),
  };
}

export function buildYandexMapWidgetSrc({
  siteName,
  campuses,
}: BuildYandexMapParams): string {
  const mappedCampuses = campusesWithCoordinates(campuses);
  const [primaryCampus] = mappedCampuses.length > 0 ? mappedCampuses : campuses;
  if (!primaryCampus) {
    return "https://yandex.ru/map-widget/v1/?mode=search&text=Москва&z=10";
  }

  const query =
    mappedCampuses.length > 1
      ? [siteName, ...mappedCampuses.map((campus) => campus.address)].join(", ")
      : buildMapQuery(siteName, primaryCampus);

  const params = new URLSearchParams({
    mode: "search",
    text: query,
    z: "15",
  });

  if (mappedCampuses.length === 1) {
    const campus = mappedCampuses[0]!;
    params.set("ll", `${campus.longitude},${campus.latitude}`);
    params.set("pt", `${campus.longitude},${campus.latitude},pm2rdm`);
    return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
  }

  if (mappedCampuses.length > 1) {
    const view = computeMapView(mappedCampuses);
    params.set("ll", view.ll);
    params.set("z", view.z);
    for (const [index, campus] of mappedCampuses.entries()) {
      const style = CAMPUS_MARKER_STYLES[index % CAMPUS_MARKER_STYLES.length];
      params.append("pt", `${campus.longitude},${campus.latitude},${style}`);
    }
    return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
  }

  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}

export function buildYandexMapsHref({
  siteName,
  campuses,
}: BuildYandexMapParams): string {
  const mappedCampuses = campusesWithCoordinates(campuses);
  const [primaryCampus] = mappedCampuses.length > 0 ? mappedCampuses : campuses;
  if (!primaryCampus) {
    return `https://yandex.ru/maps/?text=${encodeURIComponent(siteName)}`;
  }

  if (mappedCampuses.length === 1) {
    const campus = mappedCampuses[0]!;
    const params = new URLSearchParams({
      ll: `${campus.longitude},${campus.latitude}`,
      z: "15",
      text: buildMapQuery(siteName, campus),
    });
    return `https://yandex.ru/maps/?${params.toString()}`;
  }

  if (mappedCampuses.length > 1) {
    const view = computeMapView(mappedCampuses);
    const params = new URLSearchParams({
      ll: view.ll,
      z: view.z,
      text: [siteName, ...mappedCampuses.map((campus) => campus.address)].join(", "),
    });
    for (const campus of mappedCampuses) {
      params.append("pt", `${campus.longitude},${campus.latitude},pm2rdm`);
    }
    return `https://yandex.ru/maps/?${params.toString()}`;
  }

  return `https://yandex.ru/maps/?text=${encodeURIComponent(buildMapQuery(siteName, primaryCampus))}`;
}
