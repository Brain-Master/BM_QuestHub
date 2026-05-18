import type { SiteCampus } from "@/lib/sites/scope-card";

type BuildYandexMapParams = {
  siteName: string;
  campus: SiteCampus;
};

function buildMapQuery(siteName: string, campus: SiteCampus): string {
  return [siteName, campus.address, campus.metro && campus.metro !== "—" ? `м. ${campus.metro}` : undefined]
    .filter(Boolean)
    .join(", ");
}

export function buildYandexMapWidgetSrc({
  siteName,
  campus,
}: BuildYandexMapParams): string {
  const query = buildMapQuery(siteName, campus);
  const params = new URLSearchParams({
    mode: "search",
    text: query,
    z: "15",
  });

  if (typeof campus.latitude === "number" && typeof campus.longitude === "number") {
    params.set("ll", `${campus.longitude},${campus.latitude}`);
    params.set("pt", `${campus.longitude},${campus.latitude},pm2rdm`);
  }

  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}

export function buildYandexMapsHref({
  siteName,
  campus,
}: BuildYandexMapParams): string {
  if (typeof campus.latitude === "number" && typeof campus.longitude === "number") {
    const params = new URLSearchParams({
      ll: `${campus.longitude},${campus.latitude}`,
      z: "15",
      text: buildMapQuery(siteName, campus),
    });

    return `https://yandex.ru/maps/?${params.toString()}`;
  }

  return `https://yandex.ru/maps/?text=${encodeURIComponent(buildMapQuery(siteName, campus))}`;
}
