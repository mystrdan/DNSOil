import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyAccessToken } from "./access-token.js";

function makeToken(payload: Record<string, unknown>, secret = "test-signing-secret"): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const unsigned = `${header}.${body}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

test("accepts a correctly signed short-lived access token", () => {
  const token = makeToken({ sub: "Person@Example.com", iat: 1_000, exp: 1_300 });
  assert.equal(verifyAccessToken(token, "test-signing-secret", 1_100), "person@example.com");
});

test("rejects expired tokens and signatures made with another key", () => {
  const expired = makeToken({ sub: "person@example.com", iat: 1_000, exp: 1_100 });
  const signedByOtherKey = makeToken({ sub: "person@example.com", iat: 1_000, exp: 1_300 }, "other-secret");
  assert.equal(verifyAccessToken(expired, "test-signing-secret", 1_100), null);
  assert.equal(verifyAccessToken(signedByOtherKey, "test-signing-secret", 1_100), null);
});

test("rejects tokens with invalid email claims or excessive lifetime", () => {
  const invalidEmail = makeToken({ sub: "not-an-email", iat: 1_000, exp: 1_300 });
  const longLived = makeToken({ sub: "person@example.com", iat: 1_000, exp: 10_000 });
  assert.equal(verifyAccessToken(invalidEmail, "test-signing-secret", 1_100), null);
  assert.equal(verifyAccessToken(longLived, "test-signing-secret", 1_100), null);
});
