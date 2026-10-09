import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "./app.js";

test("domain validation normalizes case and trailing dot", async () => {
  const app = buildApp({ databaseUrl: "" });
  const response = await app.inject({ method: "POST", url: "/v1/domains/validate", payload: { domain: "Example.COM." } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().domain, "example.com");
  await app.close();
});

test("domain validation rejects URLs and single-label names", async () => {
  const app = buildApp({ databaseUrl: "" });
  for (const domain of ["https://example.com", "localhost", "-bad.example", "bad..example.com"]) {
    const response = await app.inject({ method: "POST", url: "/v1/domains/validate", payload: { domain } });
    assert.equal(response.statusCode, 422, domain);
  }
  await app.close();
});

test("readiness reports database as not configured without claiming it is ready", async () => {
  const app = buildApp({ databaseUrl: "" });
  const response = await app.inject({ method: "GET", url: "/ready" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().checks.database, "not-configured");
  assert.equal(response.json().status, "degraded");
  await app.close();
});
