import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "./app.js";

test("catalog rejects unsupported service type and malformed TLD", async () => {
  const app = buildApp({ databaseUrl: "" });
  const unsupported = await app.inject({ method: "GET", url: "/v1/catalog/offers?serviceType=wallet" });
  assert.equal(unsupported.statusCode, 400);
  assert.equal(unsupported.json().code, "INVALID_CATALOG_QUERY");
  const malformed = await app.inject({ method: "GET", url: "/v1/catalog/offers?serviceType=domain-registration&tld=com%2Fexample" });
  assert.equal(malformed.statusCode, 400);
  await app.close();
});

test("catalog reports database dependency instead of inventing offers", async () => {
  const app = buildApp({ databaseUrl: "" });
  const response = await app.inject({ method: "GET", url: "/v1/catalog/offers?serviceType=domain-registration&tld=com" });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().code, "DATABASE_NOT_CONFIGURED");
  await app.close();
});

test("catalog sync requires internal credentials", async () => {
  const app = buildApp({ databaseUrl: "", internalApiSecret: "catalog-test-secret" });
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/catalog/offers/sync",
    payload: { providerKey: "sample-host", providerName: "Sample", serviceCategory: "hosting", serviceType: "hosting" },
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, "UNAUTHORIZED");
  await app.close();
});

test("catalog sync rejects malformed or expired offer before database access", async () => {
  const app = buildApp({ databaseUrl: "", internalApiSecret: "catalog-test-secret" });
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/catalog/offers/sync",
    headers: { "x-dnsoil-internal-secret": "catalog-test-secret" },
    payload: {
      providerKey: "sample-registrar",
      providerName: "Sample Registrar",
      serviceCategory: "registrar",
      providerStatus: "active",
      environment: "production",
      serviceType: "domain-registration",
      productKey: "com-registration",
      productName: ".com domain registration",
      domainTld: "com",
      termMonths: 12,
      currency: "USD",
      basePriceMinor: "1200",
      available: true,
      validUntil: "2020-01-01T00:00:00.000Z",
    },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().code, "INVALID_CATALOG_OFFER");
  await app.close();
});
