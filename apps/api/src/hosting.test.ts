import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { buildApp } from "./app.js";

function token(email: string, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: email, iat: now, exp: now + 300 })).toString("base64url");
  const unsigned = header + "." + payload;
  return unsigned + "." + createHmac("sha256", secret).update(unsigned).digest("base64url");
}

test("hosting services endpoint requires a valid bearer token", async () => {
  const app = buildApp({ databaseUrl: "", apiTokenSecret: "test-token-secret" });
  const response = await app.inject({ method: "GET", url: "/v1/hosting/services" });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, "UNAUTHORIZED");
  await app.close();
});

test("hosting services endpoint reports database dependency", async () => {
  const app = buildApp({ databaseUrl: "", apiTokenSecret: "test-token-secret" });
  const response = await app.inject({
    method: "GET",
    url: "/v1/hosting/services",
    headers: { authorization: "Bearer " + token("person@example.com", "test-token-secret") },
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().code, "DATABASE_NOT_CONFIGURED");
  await app.close();
});

test("hosting sync endpoint requires internal credentials", async () => {
  const app = buildApp({ databaseUrl: "", internalApiSecret: "internal-secret" });
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/hosting/services/sync",
    payload: { email: "person@example.com", providerKey: "cpanel-provider", externalServiceId: "svc-1", productName: "Web Hosting" },
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, "UNAUTHORIZED");
  await app.close();
});

test("hosting sync validates unsafe control-panel URLs before database access", async () => {
  const app = buildApp({ databaseUrl: "", internalApiSecret: "internal-secret" });
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/hosting/services/sync",
    headers: { "x-dnsoil-internal-secret": "internal-secret" },
    payload: {
      email: "person@example.com", providerKey: "cpanel-provider", providerName: "Example Host",
      externalServiceId: "svc-1", productName: "Web Hosting", status: "active",
      controlPanelUrl: "javascript:alert(1)",
    },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().code, "INVALID_HOSTING_SERVICE");
  await app.close();
});