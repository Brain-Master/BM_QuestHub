import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { snapshotFetchInit } from "@/lib/data/snapshot-fetch";
import {
  countOffersInSnapshot,
  emptyOffersSnapshot,
  parseOffersSnapshot,
} from "@/lib/offers/snapshot-parse";

import type { OffersSnapshotV1 } from "./snapshot-types";

function snapshotPath(): string {
  const override = process.env.OFFERS_SNAPSHOT_PATH;
  if (override && override.length > 0) return path.resolve(override);
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "offers-snapshot.json");
}

function snapshotUrl(): string | null {
  const explicitUrl = process.env.OFFERS_SNAPSHOT_URL?.trim();
  if (explicitUrl) return explicitUrl;

  if (process.env.OFFERS_SNAPSHOT_SOURCE !== "s3") return null;

  const publicBaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
  if (!publicBaseUrl) return null;

  const base = publicBaseUrl.endsWith("/") ? publicBaseUrl : `${publicBaseUrl}/`;
  return new URL("data/offers-snapshot.json", base).toString();
}

export { parseOffersSnapshot } from "@/lib/offers/snapshot-parse";

function countOffers(snapshot: OffersSnapshotV1): number {
  return countOffersInSnapshot(snapshot);
}

export async function readLocalOffersSnapshot(): Promise<OffersSnapshotV1> {
  const file = snapshotPath();
  try {
    const raw = await fs.readFile(file, "utf8");
    const data = JSON.parse(raw) as unknown;
    const snapshot = parseOffersSnapshot(data, "invalid_file");
    console.info(
      `[offers-snapshot] loaded ${countOffers(snapshot)} offers from local ${file}`,
    );
    return snapshot;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      console.error("[offers-snapshot] read error:", err.message);
    } else {
      console.warn(`[offers-snapshot] local file missing: ${file}`);
    }
    return emptyOffersSnapshot("missing_or_unreadable");
  }
}

export async function readRemoteOffersSnapshot(url: string): Promise<OffersSnapshotV1> {
  try {
    const res = await fetch(url, snapshotFetchInit());
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as unknown;
    const snapshot = parseOffersSnapshot(data, "invalid_file");
    console.info(
      `[offers-snapshot] loaded ${countOffers(snapshot)} offers from ${url}`,
    );
    return snapshot;
  } catch (e) {
    const err = e as Error;
    console.warn(`[offers-snapshot] remote read failed (${url}): ${err.message}`);
    return emptyOffersSnapshot("missing_or_unreadable");
  }
}

/** Чтение последнего успешного снимка; при отсутствии или ошибке — пустой объект. */
export async function readOffersSnapshot(): Promise<OffersSnapshotV1> {
  const url = snapshotUrl();
  if (url) {
    const remote = await readRemoteOffersSnapshot(url);
    if (countOffers(remote) === 0) {
      console.warn(
        `[offers-snapshot] remote snapshot empty, falling back to local (${snapshotPath()})`,
      );
      return readLocalOffersSnapshot();
    }
    return remote;
  }
  return readLocalOffersSnapshot();
}

/** Атомарная запись: temp в том же каталоге, затем rename. */
export async function writeOffersSnapshotAtomic(
  snapshot: OffersSnapshotV1,
): Promise<void> {
  const file = snapshotPath();
  const dir = path.dirname(file);
  await fs.mkdir(dir, { recursive: true });
  const body = `${JSON.stringify(snapshot, null, 2)}\n`;
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, file);
}
