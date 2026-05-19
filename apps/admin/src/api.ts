const API_URL = import.meta.env.VITE_CONTENT_ADMIN_URL?.replace(/\/$/, "") ?? "";

function token(): string {
  return sessionStorage.getItem("contentAdminToken") ?? "";
}

function headers(): HeadersInit {
  return {
    "content-type": "application/json",
    "x-content-token": token(),
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  if (!API_URL) throw new Error("Задайте VITE_CONTENT_ADMIN_URL");
  const payload =
    body !== undefined
      ? { ...(typeof body === "object" && body !== null ? body : {}), path }
      : { path };
  const res = await fetch(API_URL, {
    method,
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      (json as { error?: string }).error ?? `HTTP ${res.status}`,
    );
  }
  return json;
}

export type SnapshotsBundle = {
  ok: boolean;
  catalog: unknown;
  map: unknown;
  site: unknown;
  manifest: unknown | null;
  offers: unknown | null;
};

export function loadSnapshots() {
  return request<SnapshotsBundle>("GET", "/snapshots");
}

export function saveSnapshot(
  type: "catalog" | "map" | "site" | "manifest" | "offers",
  data: unknown,
) {
  return request<{ ok: boolean }>("PUT", `/snapshots/${type}`, { data });
}

export function publishContent(tier: "hot" | "cold") {
  const path = tier === "hot" ? "/sync/hot" : "/sync/cold";
  return request<{ ok: boolean; tier: string; message?: string; workflow?: unknown }>(
    "POST",
    path,
    {},
  );
}

export function hasApiUrl() {
  return Boolean(API_URL);
}
