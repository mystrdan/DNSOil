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

test("user provisioning rejects requests without the internal secret", async () => {
  const app = buildApp({ databaseUrl: "", internalApiSecret: "test-secret" });
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/users/provision",
    payload: { email: "person@example.com", displayName: "Person" },
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, "UNAUTHORIZED");
  await app.close();
});

test("user provisioning reports unavailable when PostgreSQL is not configured", async () => {
  const app = buildApp({ databaseUrl: "", internalApiSecret: "test-secret" });
  const response = await app.inject({
    method: "POST",
    url: "/v1/internal/users/provision",
    headers: { "x-dnsoil-internal-secret": "test-secret" },
    payload: { email: "person@example.com", displayName: "Person" },
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().code, "DATABASE_NOT_CONFIGURED");
  await app.close();
});

test("current-user endpoint rejects requests without a bearer token", async () => {
  const app = buildApp({ databaseUrl: "", apiTokenSecret: "test-token-secret" });
  const response = await app.inject({ method: "GET", url: "/v1/me" });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, "UNAUTHORIZED");
  await app.close();
});

test("wallet endpoint rejects requests without a bearer token", async () => {
  const app = buildApp({ databaseUrl: "", apiTokenSecret: "test-token-secret" });
  const response = await app.inject({ method: "GET", url: "/v1/wallet" });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, "UNAUTHORIZED");
  await app.close();
});

test("wallet endpoint reports unavailable when PostgreSQL is not configured", async () => {
  const app = buildApp({ databaseUrl: "", apiTokenSecret: "test-token-secret" });
  const token = (await import("./test-token.js")).createTestAccessToken("person@example.com", "test-token-secret");
  const response = await app.inject({
    method: "GET",
    url: "/v1/wallet",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().code, "DATABASE_NOT_CONFIGURED");
  await app.close();
});
