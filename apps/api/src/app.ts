import { timingSafeEqual } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import { domainToASCII } from "node:url";
import { Pool } from "pg";

const DOMAIN_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TOP_LEVEL_LABEL = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/;

export interface AppOptions {
  databaseUrl?: string;
  internalApiSecret?: string;
}

function secretsMatch(expected: string, provided: string | undefined): boolean {
  if (!provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  const internalApiSecret = options.internalApiSecret ?? process.env.DNSOIL_INTERNAL_API_SECRET;
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

  app.post<{ Body: { email?: unknown; displayName?: unknown } }>(
    "/v1/internal/users/provision",
    async (request, reply) => {
      if (!internalApiSecret || !secretsMatch(internalApiSecret, request.headers["x-dnsoil-internal-secret"])) {
        return reply.code(401).send({ code: "UNAUTHORIZED", message: "Valid internal credentials are required." });
      }

      if (!pool) {
        return reply.code(503).send({ code: "DATABASE_NOT_CONFIGURED", message: "User provisioning requires PostgreSQL." });
      }

      const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
      const displayName = typeof request.body?.displayName === "string" ? request.body.displayName.trim().slice(0, 200) : null;
      if (email.length === 0 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply.code(400).send({ code: "INVALID_EMAIL", message: "Provide a valid email address." });
      }

      try {
        const result = await pool.query<{
          id: string;
          email: string;
          display_name: string | null;
          status: "active" | "suspended" | "closed";
        }>(
          `INSERT INTO app_users (email, display_name)
           VALUES ($1, $2)
           ON CONFLICT (email) DO UPDATE
             SET display_name = COALESCE(EXCLUDED.display_name, app_users.display_name),
                 updated_at = now()
           RETURNING id, email, display_name, status`,
          [email, displayName],
        );
        const user = result.rows[0];
        if (!user) {
          return reply.code(500).send({ code: "USER_PROVISIONING_FAILED", message: "The account could not be provisioned." });
        }
        if (user.status !== "active") {
          return reply.code(403).send({ code: "ACCOUNT_NOT_ACTIVE", message: "This DNSOil account is not active." });
        }
        return reply.code(200).send({
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          status: user.status,
        });
      } catch (error) {
        request.log.error({ err: error }, "Unable to provision DNSOil user");
        return reply.code(500).send({ code: "USER_PROVISIONING_FAILED", message: "The account could not be provisioned." });
      }
    },
  );

  return app;
}
