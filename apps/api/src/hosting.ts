import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { domainToASCII } from "node:url";
import type { Pool } from "pg";
import { verifyAccessToken } from "./access-token.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROVIDER_KEY = /^[a-z0-9][a-z0-9-]{1,79}$/;
const SERVICE_STATUSES = new Set(["provisioning", "active", "suspended", "overdue", "cancelled", "unknown"]);

function secretMatches(expected: string | undefined, provided: string | string[] | undefined): boolean {
  if (!expected || typeof provided !== "string" || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function safeControlPanelUrl(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.search || url.hash) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeDomain(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 253) return undefined;
  const domain = domainToASCII(value.trim().replace(/\.$/, "")).toLowerCase();
  if (!domain || !domain.includes(".") || domain.split(".").some((label) => !/^(?!-)[a-z0-9-]{1,63}(?<!-)$/.test(label))) return undefined;
  return domain;
}

export function registerHostingRoutes(
  app: FastifyInstance,
  pool: Pool | undefined,
  apiTokenSecret: string | undefined,
  internalApiSecret: string | undefined,
): void {
  app.get("/v1/hosting/services", async (request, reply) => {
    const authorization = request.headers.authorization;
    const match = typeof authorization === "string" ? /^Bearer (.+)$/.exec(authorization) : null;
    if (!apiTokenSecret) {
      return reply.code(503).send({ code: "API_AUTH_NOT_CONFIGURED", message: "API access authentication is not configured." });
    }
    const email = match?.[1] ? verifyAccessToken(match[1], apiTokenSecret) : null;
    if (!email) return reply.code(401).send({ code: "UNAUTHORIZED", message: "A valid, unexpired bearer token is required." });
    if (!pool) return reply.code(503).send({ code: "DATABASE_NOT_CONFIGURED", message: "Hosting lookup requires PostgreSQL." });

    try {
      const userResult = await pool.query<{ id: string; status: string }>(
        "SELECT id, status FROM app_users WHERE email = $1",
        [email],
      );
      const user = userResult.rows[0];
      if (!user || user.status !== "active") {
        return reply.code(403).send({ code: "ACCOUNT_NOT_ACTIVE", message: "This DNSOil account is not active." });
      }

      const result = await pool.query<{
        id: string;
        provider_key: string;
        provider_name: string;
        product_name: string;
        primary_domain: string | null;
        plan_name: string | null;
        status: string;
        renewal_at: Date | null;
        control_panel_url: string | null;
        last_synced_at: Date | null;
      }>(
        "SELECT hs.id, hpc.provider_key, hpc.display_name AS provider_name, " +
          "hs.product_name, hs.primary_domain, hs.plan_name, hs.status, hs.renewal_at, " +
          "hs.control_panel_url, hs.last_synced_at " +
          "FROM hosting_services hs JOIN hosting_provider_connections hpc ON hpc.id = hs.provider_connection_id " +
          "WHERE hs.user_id = $1 AND hs.status <> 'cancelled' " +
          "ORDER BY hs.renewal_at ASC NULLS LAST, hs.updated_at DESC LIMIT 100",
        [user.id],
      );

      return reply.code(200).send({
        services: result.rows.map((service) => ({
          id: service.id,
          providerKey: service.provider_key,
          providerName: service.provider_name,
          productName: service.product_name,
          primaryDomain: service.primary_domain,
          planName: service.plan_name,
          status: service.status,
          renewalAt: service.renewal_at,
          controlPanelUrl: service.control_panel_url,
          lastSyncedAt: service.last_synced_at,
        })),
        note: "Hosting details are provider-synced snapshots. The hosting provider remains authoritative for live status and control-panel access.",
      });
    } catch (error) {
      request.log.error({ err: error }, "Unable to load DNSOil hosting services");
      return reply.code(500).send({ code: "HOSTING_LOOKUP_FAILED", message: "Hosting services could not be loaded." });
    }
  });

  // Trusted adapter workers call this after synchronizing a service from its actual hosting provider.
  // It is not a public customer endpoint and does not accept or store control-panel passwords.
  app.post<{ Body: Record<string, unknown> }>("/v1/internal/hosting/services/sync", async (request, reply) => {
    if (!secretMatches(internalApiSecret, request.headers["x-dnsoil-internal-secret"])) {
      return reply.code(401).send({ code: "UNAUTHORIZED", message: "Valid internal credentials are required." });
    }
    if (!pool) return reply.code(503).send({ code: "DATABASE_NOT_CONFIGURED", message: "Hosting synchronization requires PostgreSQL." });

    const body = request.body ?? {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const providerKey = typeof body.providerKey === "string" ? body.providerKey.trim().toLowerCase() : "";
    const providerName = typeof body.providerName === "string" ? body.providerName.trim() : "";
    const environment = body.environment === undefined ? "production" : body.environment;
    const externalServiceId = typeof body.externalServiceId === "string" ? body.externalServiceId.trim() : "";
    const productName = typeof body.productName === "string" ? body.productName.trim() : "";
    const planName = typeof body.planName === "string" && body.planName.trim() ? body.planName.trim() : null;
    const status = typeof body.status === "string" ? body.status : "unknown";
    const primaryDomain = normalizeDomain(body.primaryDomain);
    const controlPanelUrl = safeControlPanelUrl(body.controlPanelUrl);
    const renewalAt = body.renewalAt === undefined || body.renewalAt === null || body.renewalAt === ""
      ? null
      : typeof body.renewalAt === "string" && !Number.isNaN(Date.parse(body.renewalAt))
        ? new Date(body.renewalAt)
        : undefined;

    if (!EMAIL.test(email) || !PROVIDER_KEY.test(providerKey) || !providerName || providerName.length > 120
      || !["sandbox", "production"].includes(String(environment))
      || !externalServiceId || externalServiceId.length > 200
      || !productName || productName.length > 160
      || !SERVICE_STATUSES.has(status)
      || primaryDomain === undefined || controlPanelUrl === undefined || renewalAt === undefined) {
      return reply.code(400).send({
        code: "INVALID_HOSTING_SERVICE",
        message: "Provide a valid customer email, provider, service ID, product, status, and safe optional domain, renewal date, and HTTPS control-panel URL.",
      });
    }

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const userResult = await client.query<{ id: string; status: string }>(
          "SELECT id, status FROM app_users WHERE email = $1 FOR SHARE",
          [email],
        );
        const user = userResult.rows[0];
        if (!user || user.status !== "active") {
          await client.query("ROLLBACK");
          return reply.code(404).send({ code: "ACTIVE_USER_NOT_FOUND", message: "An active DNSOil user with this email was not found." });
        }

        const providerResult = await client.query<{ id: string }>(
          "INSERT INTO hosting_provider_connections (provider_key, display_name, environment, status) " +
            "VALUES ($1, $2, $3, 'active') ON CONFLICT (provider_key, environment) DO UPDATE " +
            "SET display_name = EXCLUDED.display_name, status = 'active', updated_at = now() RETURNING id",
          [providerKey, providerName, environment],
        );
        const provider = providerResult.rows[0];
        if (!provider) throw new Error("Hosting provider connection could not be resolved.");

        const serviceResult = await client.query<{ id: string; user_id: string }>(
          "INSERT INTO hosting_services (user_id, provider_connection_id, external_service_id, primary_domain, product_name, " +
            "plan_name, status, renewal_at, control_panel_url, last_synced_at) " +
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now()) " +
            "ON CONFLICT (provider_connection_id, external_service_id) DO UPDATE SET " +
            "primary_domain = EXCLUDED.primary_domain, product_name = EXCLUDED.product_name, plan_name = EXCLUDED.plan_name, " +
            "status = EXCLUDED.status, renewal_at = EXCLUDED.renewal_at, control_panel_url = EXCLUDED.control_panel_url, " +
            "last_synced_at = now(), updated_at = now() WHERE hosting_services.user_id = EXCLUDED.user_id " +
            "RETURNING id, user_id",
          [user.id, provider.id, externalServiceId, primaryDomain, productName, planName, status, renewalAt, controlPanelUrl],
        );
        if (!serviceResult.rows[0]) {
          await client.query("ROLLBACK");
          return reply.code(409).send({ code: "HOSTING_SERVICE_OWNER_CONFLICT", message: "This provider service is already linked to a different DNSOil account." });
        }
        await client.query("COMMIT");
        return reply.code(200).send({ synced: true, serviceId: serviceResult.rows[0].id, lastSyncedAt: new Date().toISOString() });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error({ err: error }, "Unable to synchronize DNSOil hosting service");
      return reply.code(500).send({ code: "HOSTING_SYNC_FAILED", message: "The hosting service could not be synchronized." });
    }
  });
}
