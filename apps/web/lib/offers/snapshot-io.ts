import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { venueOfferSchema } from "@/lib/schemas";
import { z } from "zod";

import type { OffersSnapshotSource, OffersSnapshotV1 } from "./snapshot-types";

const snapshotSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  source: z.string().optional(),
  offersByQuest: z.record(z.string(), z.array(venueOfferSchema)),
});

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

export function parseOffersSnapshot(
  data: unknown,
  invalidSource: OffersSnapshotSource = "invalid_file",
): OffersSnapshotV1 {
  const parsed = snapshotSchema.safeParse(data);
  if (!parsed.success) {
    console.error(
      "[offers-snapshot] invalid snapshot payload, ignoring:",
      parsed.error.flatten(),
    );
    return emptySnapshot(invalidSource);
  }
  return parsed.data;
}

export async function readLocalOffersSnapshot(): Promise<OffersSnapshotV1> {
  const file = snapshotPath();
  try {
    const raw = await fs.readFile(file, "utf8");
    const data = JSON.parse(raw) as unknown;
    return parseOffersSnapshot(data, "invalid_file");
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      console.error("[offers-snapshot] read error:", err.message);
    }
    return emptySnapshot("missing_or_unreadable");
  }
}

export async function readRemoteOffersSnapshot(url: string): Promise<OffersSnapshotV1> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as unknown;
    return parseOffersSnapshot(data, "invalid_file");
  } catch (e) {
    const err = e as Error;
    console.error("[offers-snapshot] remote read error:", err.message);
    return emptySnapshot("missing_or_unreadable");
  }
}

/** Чтение последнего успешного снимка; при отсутствии или ошибке — пустой объект. */
export async function readOffersSnapshot(): Promise<OffersSnapshotV1> {
  const url = snapshotUrl();
  if (url) return readRemoteOffersSnapshot(url);
  return readLocalOffersSnapshot();
}

function emptySnapshot(source: OffersSnapshotSource): OffersSnapshotV1 {
  return {
    version: 1,
    generatedAt: new Date(0).toISOString(),
    source,
    offersByQuest: {},
  };
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
