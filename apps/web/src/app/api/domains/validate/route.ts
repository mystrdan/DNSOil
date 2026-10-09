import { domainToASCII } from "node:url";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DOMAIN_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TOP_LEVEL_LABEL = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/;

function validateSyntax(input: unknown) {
  if (typeof input !== "string" || input.trim().length === 0 || input.length > 253) {
    return {
      status: 400,
      body: { code: "INVALID_DOMAIN", message: "Provide a domain name containing 1 to 253 characters." },
    };
  }
  const ascii = domainToASCII(input.trim().replace(/\.$/, "")).toLowerCase();
  const labels = ascii.split(".");
  const valid = ascii.length > 0 && ascii.length <= 253 && labels.length >= 2
    && labels.every((label) => DOMAIN_LABEL.test(label))
    && TOP_LEVEL_LABEL.test(labels[labels.length - 1] ?? "");
  if (!valid) {
    return { status: 422, body: { code: "INVALID_DOMAIN", message: "Enter a valid domain name, such as example.com." } };
  }
  return {
    status: 200,
    body: { domain: ascii, valid: true, note: "Syntax only; this does not check availability or ownership." },
  };
}

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

  const apiUrl = process.env.DNSOIL_API_URL;
  if (!apiUrl) {
    // Keep Vercel previews functional without requiring a separately deployed API.
    const result = validateSyntax((body as { domain: unknown }).domain);
    return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
  }

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
