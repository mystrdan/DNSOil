import Fastify, { type FastifyInstance } from "fastify";
import { domainToASCII } from "node:url";
import { Pool } from "pg";

const DOMAIN_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TOP_LEVEL_LABEL = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/;

export interface AppOptions {
  databaseUrl?: string;
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  const pool = databaseUrl
    ? new Pool({ connectionString: databaseUrl, max: 5, connectionTimeoutMillis: 2_000 })
    : undefined;

  const app = Fastify({ logger: true, requestIdHeader: "x-request-id" });

  app.addHook("onClose", async () => {
    await pool?.end();
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "dnsoil-api",
    timestamp: new Date().toISOString(),
  }));

  app.get("/ready", async (_request, reply) => {
    if (!pool) {
      return reply.code(200).send({
        status: "degraded",
        checks: { database: "not-configured" },
      });
    }

    try {
      await pool.query("SELECT 1");
      return reply.code(200).send({ status: "ready", checks: { database: "ok" } });
    } catch {
      return reply.code(503).send({
        status: "not-ready",
        checks: { database: "unavailable" },
      });
    }
  });

  app.post<{ Body: { domain?: unknown } }>("/v1/domains/validate", async (request, reply) => {
    const input = request.body?.domain;
    if (typeof input !== "string" || input.trim().length === 0 || input.length > 253) {
      return reply.code(400).send({
        code: "INVALID_DOMAIN",
        message: "Provide a domain name containing 1 to 253 characters.",
        requestId: request.id,
      });
    }

    const ascii = domainToASCII(input.trim().replace(/\.$/, "")).toLowerCase();
    const labels = ascii.split(".");
    const valid = ascii.length > 0
      && ascii.length <= 253
      && labels.length >= 2
      && labels.every((label) => DOMAIN_LABEL.test(label))
      && TOP_LEVEL_LABEL.test(labels[labels.length - 1] ?? "");

    if (!valid) {
      return reply.code(422).send({
        code: "INVALID_DOMAIN",
        message: "Enter a valid domain name, such as example.com.",
        requestId: request.id,
      });
    }

    return reply.code(200).send({
      domain: ascii,
      valid: true,
      note: "Syntax only; this does not check availability or ownership.",
    });
  });

  return app;
}
