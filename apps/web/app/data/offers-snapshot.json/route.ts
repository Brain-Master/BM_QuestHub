import snapshot from "@/data/offers-snapshot.json";

/** Same compiled public snapshot; opt-in local/static preview, not a write API. */
export const dynamic = "force-static";
export function GET() { return Response.json(snapshot); }
