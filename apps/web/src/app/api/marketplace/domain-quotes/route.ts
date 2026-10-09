import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const domain = new URL(request.url).searchParams.get("domain") ?? "";
  const apiUrl = process.env.DNSOIL_API_URL;
  if (!apiUrl) {
    return NextResponse.json({
      domain,
      quoteStatus: "no-fresh-quotes",
      markupBasisPoints: 100,
      quotes: [],
      note: "No live registrar integrations are connected to this environment. DNSOil will not invent provider prices or availability.",
    }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const url = new URL("/v1/marketplace/domain-quotes", apiUrl);
    url.searchParams.set("domain", domain);
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000), cache: "no-store" });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ code: "MARKETPLACE_UNAVAILABLE", message: "Provider price comparison is not reachable right now." }, { status: 503 });
  }
}
