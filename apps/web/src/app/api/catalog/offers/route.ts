import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const serviceType = incoming.searchParams.get("serviceType") ?? "domain-registration";
  const tld = incoming.searchParams.get("tld") ?? "";
  const currency = incoming.searchParams.get("currency") ?? "USD";
  const apiUrl = process.env.DNSOIL_API_URL;
  if (!apiUrl) {
    return NextResponse.json({
      serviceType,
      currency,
      dnsoilFeeBps: 100,
      offers: [],
      note: "No live provider catalog is connected in this environment. DNSOil does not invent provider prices or domain availability.",
    }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const url = new URL("/v1/catalog/offers", apiUrl);
    url.searchParams.set("serviceType", serviceType);
    url.searchParams.set("currency", currency);
    if (tld) url.searchParams.set("tld", tld);
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000), cache: "no-store" });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ code: "CATALOG_UNAVAILABLE", message: "The provider catalog is not reachable right now." }, { status: 503 });
  }
}
