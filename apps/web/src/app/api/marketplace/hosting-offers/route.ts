import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiUrl = process.env.DNSOIL_API_URL;
  if (!apiUrl) {
    return NextResponse.json({
      markupBasisPoints: 100,
      offers: [],
      note: "No live hosting catalog integrations are connected to this environment.",
    }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const response = await fetch(new URL("/v1/marketplace/hosting-offers", apiUrl), {
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ code: "MARKETPLACE_UNAVAILABLE", message: "Hosting offers are not reachable right now." }, { status: 503 });
  }
}
