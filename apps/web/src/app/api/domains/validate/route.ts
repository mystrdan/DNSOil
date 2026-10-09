import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "INVALID_JSON", message: "Send a valid JSON request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("domain" in body)) {
    return NextResponse.json({ code: "INVALID_DOMAIN", message: "Provide a domain name." }, { status: 400 });
  }

  const apiUrl = process.env.DNSOIL_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(new URL("/v1/domains/validate", apiUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain: (body as { domain: unknown }).domain }),
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_UNAVAILABLE", message: "The domain validation service is not reachable right now." },
      { status: 503 },
    );
  }
}
