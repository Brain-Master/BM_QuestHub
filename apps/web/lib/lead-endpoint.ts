const legacy = "https://functions.yandexcloud.net/d4ellekng389grh5rck4";
export function resolveLeadEndpoint(configured: string) {
  const value = configured.trim();
  return !value || value.replace(/\/$/, "") === legacy
    ? "https://space.b-master.pro/api/leads" : value;
}
