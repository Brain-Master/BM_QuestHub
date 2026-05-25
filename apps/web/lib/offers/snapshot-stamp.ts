import { isDisplayableSnapshotGeneratedAt } from "@/lib/offers/snapshot-parse";

/** Query flag for ops links: `/agenda/?datastamp=1` shows snapshot generatedAt in the notice. */
export const SNAPSHOT_STAMP_QUERY = "datastamp";

export function isSnapshotStampVisible(
  params: URLSearchParams | null | undefined,
): boolean {
  return params?.get(SNAPSHOT_STAMP_QUERY) === "1";
}

export function formatSnapshotTime(iso: string | null | undefined): string | null {
  if (!isDisplayableSnapshotGeneratedAt(iso)) return null;
  const d = new Date(iso!);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
