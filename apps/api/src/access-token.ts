import { createHmac, timingSafeEqual } from "node:crypto";

interface AccessTokenPayload {
  sub?: unknown;
  iat?: unknown;
  exp?: unknown;
}

export function verifyAccessToken(token: string, secret: string, now = Math.floor(Date.now() / 1000)): string | null {
  if (!secret || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  if (!encodedHeader || !encodedPayload || !signature) return null;

  try {
    const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as { alg?: unknown; typ?: unknown };
    if (header.alg !== "HS256" || header.typ !== "JWT") return null;

    const expected = createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AccessTokenPayload;
    if (typeof payload.sub !== "string" || payload.sub.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.sub)) return null;
    if (!Number.isInteger(payload.iat) || !Number.isInteger(payload.exp)) return null;
    const issuedAt = payload.iat as number;
    const expiresAt = payload.exp as number;
    if (issuedAt > now + 60 || expiresAt <= now || expiresAt <= issuedAt || expiresAt - issuedAt > 600) return null;
    return payload.sub.toLowerCase();
  } catch {
    return null;
  }
}
