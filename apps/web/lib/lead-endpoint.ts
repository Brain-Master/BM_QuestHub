const previous = "https://space.b-master.pro/api/leads";
const current = "https://forms.b-master.pro/api/leads";
const legacy = "https://functions.yandexcloud.net/d4ellekng389grh5rck4";
export function resolveLeadEndpoint(configured: string) {
  const value = configured.trim();
  return !value || [legacy, previous].includes(value.replace(/\/$/, ""))
    ? current : value;
}
