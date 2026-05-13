import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { venueOfferSchema } from "@/lib/schemas";
import { z } from "zod";

import type { OffersSnapshotV1 } from "./snapshot-types";

const WEB_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const snapshotSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  source: z.string().optional(),
  offersByQuest: z.record(z.string(), z.array(venueOfferSchema)),
});

function snapshotPath(): string {
  const override = process.env.OFFERS_SNAPSHOT_PATH;
  if (override && override.length > 0) return path.resolve(override);
  return path.join(WEB_ROOT, "data", "offers-snapshot.json");
}

/** Чтение последнего успешного снимка; при отсутствии или ошибке — пустой объект. */
export async function readOffersSnapshot(): Promise<OffersSnapshotV1> {
  const file = snapshotPath();
  try {
    const raw = await fs.readFile(file, "utf8");
    const data = JSON.parse(raw) as unknown;
    const parsed = snapshotSchema.safeParse(data);
    if (!parsed.success) {
      console.error(
        "[offers-snapshot] invalid snapshot file, ignoring:",
        parsed.error.flatten(),
      );
      return emptySnapshot("invalid_file");
    }
    return parsed.data;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      console.error("[offers-snapshot] read error:", err.message);
    }
    return emptySnapshot("missing_or_unreadable");
  }
}

function emptySnapshot(source: string): OffersSnapshotV1 {
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
