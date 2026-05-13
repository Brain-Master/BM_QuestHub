import { syncOffersFromGoogleSheet } from "@/lib/offers/sync-from-sheet";

export const runtime = "nodejs";

/**
 * POST /api/internal/sync-offers
 * Authorization: Bearer <SYNC_OFFERS_SECRET>
 *
 * Тянет приватную Google Таблицу, валидирует строки, при успехе атомарно пишет data/offers-snapshot.json.
 */
export async function POST(req: Request) {
  const secret = process.env.SYNC_OFFERS_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { ok: false, error: "SYNC_OFFERS_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization")?.trim();
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncOffersFromGoogleSheet();
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
