import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { buildApp } from "./app.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for the catalog smoke test.");
const internalApiSecret = "catalog-smoke-internal-secret";
const providerKey = "catalog-smoke-" + randomUUID().slice(0, 8);
const pool = new Pool({ connectionString: databaseUrl });
const app = buildApp({ databaseUrl, internalApiSecret });

async function syncOffer(body: Record<string, unknown>) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/catalog/offers/sync",
    headers: { "x-dnsoil-internal-secret": internalApiSecret },
    payload: body,
  });
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(response.json().synced, true);
}

async function main() {
  await syncOffer({
    providerKey,
    providerName: "DNSOil Catalog Smoke Provider",
    serviceCategory: "registrar",
    providerStatus: "active",
    environment: "production",
    serviceType: "domain-registration",
    productKey: "com-registration",
    productName: ".com registration",
    domainTld: "com",
    termMonths: 12,
    currency: "USD",
    basePriceMinor: "1999",
    available: true,
    validUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    metadata: { privacyIncluded: true },
  });

  const quote = await app.inject({
    method: "GET",
    url: "/v1/catalog/offers?serviceType=domain-registration&tld=com",
  });
  assert.equal(quote.statusCode, 200, quote.body);
  const offer = quote.json().offers.find((item: { provider: { key: string } }) => item.provider.key === providerKey);
  assert.ok(offer, "active, fresh synchronized offer should be listed");
  assert.equal(offer.providerPriceMinor, "1999");
  assert.equal(offer.dnsoilFeeBps, 100);
  assert.equal(offer.dnsoilFeeMinor, "20", "1% fee should round up to the next minor unit");
  assert.equal(offer.totalPriceMinor, "2019");
  assert.equal(offer.attributes.privacyIncluded, true);

  await syncOffer({
    providerKey: providerKey + "-hidden",
    providerName: "Unavailable Smoke Provider",
    serviceCategory: "registrar",
    providerStatus: "active",
    environment: "production",
    serviceType: "domain-registration",
    productKey: "com-registration",
    productName: ".com registration",
    domainTld: "com",
    termMonths: 12,
    currency: "USD",
    basePriceMinor: "500",
    available: false,
    validUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  const filtered = await app.inject({
    method: "GET",
    url: "/v1/catalog/offers?serviceType=domain-registration&tld=com",
  });
  assert.equal(filtered.statusCode, 200, filtered.body);
  assert.equal(filtered.json().offers.some((item: { provider: { key: string } }) => item.provider.key === providerKey + "-hidden"), false);

  console.info("Catalog smoke test passed: provider offer sync, unavailable-offer filtering, and integer-minor-unit 1% fee calculation.");
}

try {
  await main();
} finally {
  await app.close();
  await pool.query(
    "DELETE FROM provider_catalog_offers WHERE provider_id IN (SELECT id FROM provider_catalog_providers WHERE provider_key LIKE $1)",
    [providerKey + "%"],
  );
  await pool.query("DELETE FROM provider_catalog_providers WHERE provider_key LIKE $1", [providerKey + "%"]);
  await pool.end();
}
