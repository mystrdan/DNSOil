import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { buildApp } from "./app.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for marketplace smoke tests.");
const internalApiSecret = "marketplace-smoke-internal-secret";
const providerKey = "marketplace-" + randomUUID().slice(0, 8);
const domain = "marketplace-" + randomUUID().slice(0, 8) + ".example";
const pool = new Pool({ connectionString: databaseUrl });
const app = buildApp({ databaseUrl, internalApiSecret });

async function main() {
  const synced = await app.inject({
    method: "POST",
    url: "/v1/internal/marketplace/domain-quotes/sync",
    headers: { "x-dnsoil-internal-secret": internalApiSecret },
    payload: {
      providerKey,
      providerName: "Marketplace Smoke Provider",
      environment: "production",
      domain,
      available: true,
      registrationPrice: "10.00",
      renewalPrice: "12.00",
      transferPrice: "9.00",
      currency: "USD",
      termYears: 1,
      expiresInSeconds: 300,
    },
  });
  assert.equal(synced.statusCode, 201, synced.body);

  const compared = await app.inject({ method: "GET", url: "/v1/marketplace/domain-quotes?domain=" + domain });
  assert.equal(compared.statusCode, 200, compared.body);
  const quote = compared.json().quotes[0];
  assert.ok(quote, "fresh synced provider quote should be returned");
  assert.equal(quote.available, true);
  assert.equal(quote.registration.providerPriceMinor, "1000");
  assert.equal(quote.registration.dnsoilFeeMinor, "10");
  assert.equal(quote.registration.customerTotalMinor, "1010");
  assert.equal(quote.renewal.providerPriceMinor, "1200");
  assert.equal(quote.renewal.dnsoilFeeMinor, "12");
  assert.equal(quote.renewal.customerTotalMinor, "1212");
  assert.equal(compared.json().markupBasisPoints, 100);

  const offers = await app.inject({ method: "GET", url: "/v1/marketplace/hosting-offers" });
  assert.equal(offers.statusCode, 200, offers.body);
  console.info("Marketplace smoke test passed: provider quote sync, live quote listing, renewal pricing and transparent 1% fee arithmetic.");
}

try {
  await main();
} finally {
  await app.close();
  await pool.query("DELETE FROM domain_price_quotes WHERE domain_name = $1", [domain]);
  await pool.query("DELETE FROM provider_connections WHERE provider_key = $1 AND environment = 'production'", [providerKey]);
  await pool.end();
}
