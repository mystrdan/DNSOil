import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "./app.js";

test("domain quotes endpoint validates domain input", async () => {
  const app = buildApp({ databaseUrl: "" });
  const response = await app.inject({ method: "GET", url: "/v1/marketplace/domain-quotes?domain=bad" });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().code, "INVALID_DOMAIN");
  await app.close();
});

test("domain quotes endpoint makes no live-price claim when PostgreSQL is not configured", async () => {
  const app = buildApp({ databaseUrl: "" });
  const response = await app.inject({ method: "GET", url: "/v1/marketplace/domain-quotes?domain=example.com" });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().code, "DATABASE_NOT_CONFIGURED");
  await app.close();
});

test("domain quote sync requires internal credentials", async () => {
  const app = buildApp({ databaseUrl: "", internalApiSecret: "internal-secret" });
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/marketplace/domain-quotes/sync",
    payload: { providerKey: "example-registrar", providerName: "Example Registrar", domain: "example.com", available: true, registrationPrice: "10.00" },
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, "UNAUTHORIZED");
  await app.close();
});

test("domain quote sync rejects invalid quote inputs before database access", async () => {
  const app = buildApp({ databaseUrl: "", internalApiSecret: "internal-secret" });
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/marketplace/domain-quotes/sync",
    headers: { "x-dnsoil-internal-secret": "internal-secret" },
    payload: {
      providerKey: "example-registrar", providerName: "Example Registrar", domain: "example.com",
      available: true, registrationPrice: "-4.00", expiresInSeconds: 10,
    },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().code, "INVALID_DOMAIN_QUOTE");
  await app.close();
});

test("hosting offers endpoint reports unavailable integration without database", async () => {
  const app = buildApp({ databaseUrl: "" });
  const response = await app.inject({ method: "GET", url: "/v1/marketplace/hosting-offers" });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().code, "DATABASE_NOT_CONFIGURED");
  await app.close();
});
