import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

function base64url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ code: "UNAUTHENTICATED", message: "Sign in before requesting API access." }, { status: 401 });
  }

  const secret = process.env.DNSOIL_API_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json({ code: "API_AUTH_NOT_CONFIGURED", message: "API access is not configured." }, { status: 503 });
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: email, iat: issuedAt, exp: issuedAt + 300 }));
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(unsignedToken).digest("base64url");
  return NextResponse.json(
    { accessToken: `${unsignedToken}.${signature}`, tokenType: "Bearer", expiresIn: 300 },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
