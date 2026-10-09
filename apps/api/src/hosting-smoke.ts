import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { buildApp } from "./app.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for the hosting smoke test.");

const apiTokenSecret = "hosting-smoke-api-token-secret";
const internalApiSecret = "hosting-smoke-internal-secret";
const email = "hosting-smoke-" + randomUUID() + "@example.com";
const secondEmail = "hosting-smoke-owner-" + randomUUID() + "@example.com";
const providerKey = "smoke-host-" + randomUUID().slice(0, 8);
const externalServiceId = "service-" + randomUUID();
const pool = new Pool({ connectionString: databaseUrl });
const app = buildApp({ databaseUrl, apiTokenSecret, internalApiSecret });

function token(subject: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: subject, iat: now, exp: now + 300 })).toString("base64url");
  const unsigned = header + "." + payload;
  return unsigned + "." + createHmac("sha256", apiTokenSecret).update(unsigned).digest("base64url");
}

async function main() {
  await pool.query("INSERT INTO app_users (email, display_name) VALUES ($1, 'Hosting smoke test'), ($2, 'Hosting conflict test')", [email, secondEmail]);
  const synced = await app.inject({
    method: "POST",
    url: "/v1/internal/hosting/services/sync",
    headers: { "x-dnsoil-internal-secret": internalApiSecret },
    payload: {
      email,
      providerKey,
      providerName: "DNSOil Test Hosting Provider",
      environment: "sandbox",
      externalServiceId,
      productName: "Smoke Test Web Hosting",
      primaryDomain: "Example.COM.",
      planName: "Test plan",
      status: "active",
      renewalAt: "2027-02-03T00:00:00.000Z",
      controlPanelUrl: "https://panel.example.com/",
    },
  });
  assert.equal(synced.statusCode, 200, synced.body);
  assert.equal(synced.json().synced, true);

  const listed = await app.inject({
    method: "GET",
    url: "/v1/hosting/services",
    headers: { authorization: "Bearer " + token(email) },
  });
  assert.equal(listed.statusCode, 200, listed.body);
  const service = listed.json().services.find((item: { productName: string }) => item.productName === "Smoke Test Web Hosting");
  assert.ok(service, "synced hosting service should be visible to its owner");
  assert.equal(service.primaryDomain, "example.com");
  assert.equal(service.controlPanelUrl, "https://panel.example.com/");
  assert.equal(service.status, "active");

  const otherAccount = await app.inject({
    method: "POST",
    url: "/v1/internal/hosting/services/sync",
    headers: { "x-dnsoil-internal-secret": internalApiSecret },
    payload: {
      email: secondEmail,
      providerKey,
      providerName: "DNSOil Test Hosting Provider",
      environment: "sandbox",
      externalServiceId,
      productName: "Stolen ownership attempt",
      status: "active",
    },
  });
  assert.equal(otherAccount.statusCode, 409, otherAccount.body);
  assert.equal(otherAccount.json().code, "HOSTING_SERVICE_OWNER_CONFLICT");

  const invalidPanel = await app.inject({
    method: "POST",
    url: "/v1/internal/hosting/services/sync",
    headers: { "x-dnsoil-internal-secret": internalApiSecret },
    payload: {
      email,
      providerKey,
      providerName: "DNSOil Test Hosting Provider",
      environment: "sandbox",
      externalServiceId: "unsafe-" + randomUUID(),
      productName: "Unsafe portal test",
      status: "active",
      controlPanelUrl: "https://user:password@panel.example.com/",
    },
  });
  assert.equal(invalidPanel.statusCode, 400, invalidPanel.body);

  console.info("Hosting smoke test passed: sync, owner-scoped listing, ownership conflict and control-panel URL validation.");
}

try {
  await main();
} finally {
  await app.close();
  await pool.query("DELETE FROM hosting_services WHERE user_id IN (SELECT id FROM app_users WHERE email IN ($1, $2))", [email, secondEmail]);
  await pool.query("DELETE FROM app_users WHERE email IN ($1, $2)", [email, secondEmail]);
  await pool.end();
}
