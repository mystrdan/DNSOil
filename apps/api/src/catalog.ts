import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";

const SERVICE_TYPES = new Set(["domain-registration", "domain-renewal", "domain-transfer", "hosting"]);
const SERVICE_CATEGORIES = new Set(["registrar", "hosting"]);
const PROVIDER_STATUSES = new Set(["disabled", "testing", "active", "degraded"]);
const ENVIRONMENTS = new Set(["sandbox", "production"]);
const CURRENCIES = new Set(["USD"]);
const PROVIDER_KEY = /^[a-z0-9][a-z0-9-]{1,79}$/;
const TLD = /^[a-z0-9-]{2,63}$/;
const PRODUCT_KEY = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const MARKUP_BPS = 100;

function secretMatches(expected: string | undefined, provided: string | string[] | undefined): boolean {
  if (!expected || typeof provided !== "string" || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result && result.length <= max ? result : null;
}

function safeJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

const SENSITIVE_METADATA_KEY = /(?:secret|password|credential|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|session|private[_-]?key|sso[_-]?url)/i;

function hasSensitiveKey(value: unknown, depth = 0): boolean {
  if (depth > 8) return true;
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasSensitiveKey(item, depth + 1));
  return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
    SENSITIVE_METADATA_KEY.test(key) || hasSensitiveKey(child, depth + 1));
}

function isBoundedJson(value: Record<string, unknown>): boolean {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8") <= 16_384;
  } catch {
    return false;
  }
}

function calculateFee(baseMinor: string): string {
  const base = BigInt(baseMinor);
  return ((base * BigInt(MARKUP_BPS) + 9999n) / 10000n).toString();
}

export function registerCatalogRoutes(
  app: FastifyInstance,
  pool: Pool | undefined,
  internalApiSecret: string | undefined,
): void {
  app.get<{ Querystring: { serviceType?: string; tld?: string; currency?: string } }>(
    "/v1/catalog/offers",
    async (request, reply) => {
      const serviceType = request.query.serviceType ?? "domain-registration";
      const currency = request.query.currency ?? "USD";
      const rawTld = request.query.tld?.trim().toLowerCase().replace(/^\./, "");
      if (!SERVICE_TYPES.has(serviceType) || !CURRENCIES.has(currency)
        || (rawTld && (!TLD.test(rawTld) || rawTld.includes("..")))) {
        return reply.code(400).send({
          code: "INVALID_CATALOG_QUERY",
          message: "Use a supported serviceType, USD currency, and a valid optional domain TLD.",
        });
      }
      if (!pool) {
        return reply.code(503).send({ code: "DATABASE_NOT_CONFIGURED", message: "Provider catalogue requires PostgreSQL." });
      }

      try {
        const result = await pool.query<{
          id: string;
          provider_key: string;
          provider_name: string;
          service_category: string;
          service_type: string;
          product_key: string;
          product_name: string;
          domain_tld: string | null;
          term_months: number;
          currency: string;
          base_price_minor: string;
          valid_until: Date;
          synced_at: Date;
          metadata: Record<string, unknown>;
        }>(
          "SELECT o.id, p.provider_key, p.display_name AS provider_name, p.service_category, " +
            "o.service_type, o.product_key, o.product_name, o.domain_tld, o.term_months, o.currency, " +
            "o.base_price_minor::text AS base_price_minor, o.valid_until, o.synced_at, o.metadata " +
            "FROM provider_catalog_offers o JOIN provider_catalog_providers p ON p.id = o.provider_id " +
            "WHERE p.status = 'active' AND p.environment = 'production' AND p.service_category = $1 " +
            "AND o.service_type = $2 AND o.currency = $3 AND o.is_available = true AND o.valid_until > now() " +
            "AND ($4::text IS NULL OR o.domain_tld = $4) " +
            "ORDER BY o.base_price_minor ASC, p.display_name ASC LIMIT 100",
          [serviceType === "hosting" ? "hosting" : "registrar", serviceType, currency, rawTld ?? null],
        );
        const offers = result.rows.map((offer) => {
          const feeMinor = calculateFee(offer.base_price_minor);
          return {
            id: offer.id,
            provider: { key: offer.provider_key, name: offer.provider_name, category: offer.service_category },
            serviceType: offer.service_type,
            productKey: offer.product_key,
            productName: offer.product_name,
            domainTld: offer.domain_tld,
            termMonths: offer.term_months,
            currency: offer.currency,
            providerPriceMinor: offer.base_price_minor,
            dnsoilFeeBps: MARKUP_BPS,
            dnsoilFeeMinor: feeMinor,
            totalPriceMinor: (BigInt(offer.base_price_minor) + BigInt(feeMinor)).toString(),
            priceValidUntil: offer.valid_until,
            syncedAt: offer.synced_at,
            attributes: offer.metadata,
          };
        });
        return reply.code(200).send({
          serviceType,
          currency,
          dnsoilFeeBps: MARKUP_BPS,
          offers,
          note: offers.length
            ? "Prices are provider-synchronized snapshots and expire at priceValidUntil. Confirm availability and final price with the provider before checkout."
            : "No verified live provider offers are available for this query yet. DNSOil does not fabricate availability or pricing.",
        });
      } catch (error) {
        request.log.error({ err: error }, "Unable to load provider catalogue");
        return reply.code(500).send({ code: "CATALOG_LOOKUP_FAILED", message: "Provider offers could not be loaded." });
      }
    },
  );

  app.post<{ Body: Record<string, unknown> }>("/v1/internal/catalog/offers/sync", async (request, reply) => {
    if (!secretMatches(internalApiSecret, request.headers["x-dnsoil-internal-secret"])) {
      return reply.code(401).send({ code: "UNAUTHORIZED", message: "Valid internal credentials are required." });
    }

    const body = request.body ?? {};
    const providerKey = cleanText(body.providerKey, 80)?.toLowerCase() ?? "";
    const providerName = cleanText(body.providerName, 120) ?? "";
    const serviceCategory = typeof body.serviceCategory === "string" ? body.serviceCategory : "";
    const providerStatus = typeof body.providerStatus === "string" ? body.providerStatus : "testing";
    const environment = typeof body.environment === "string" ? body.environment : "production";
    const serviceType = typeof body.serviceType === "string" ? body.serviceType : "";
    const productKey = cleanText(body.productKey, 160) ?? "";
    const productName = cleanText(body.productName, 160) ?? "";
    const rawTld = typeof body.domainTld === "string" ? body.domainTld.trim().toLowerCase().replace(/^\./, "") : null;
    const termMonths = body.termMonths === undefined ? 12 : typeof body.termMonths === "number" ? body.termMonths : Number.NaN;
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "USD";
    const priceRaw = typeof body.basePriceMinor === "string" ? body.basePriceMinor : typeof body.basePriceMinor === "number" ? String(body.basePriceMinor) : "";
    const validUntilRaw = typeof body.validUntil === "string" ? body.validUntil : "";
    const available = body.available === true;
    const capabilities = safeJsonObject(body.capabilities);
    const metadata = safeJsonObject(body.metadata);
    const validUntil = new Date(validUntilRaw);
    let price: bigint | null = null;
    try {
      if (/^\d{1,15}$/.test(priceRaw)) price = BigInt(priceRaw);
    } catch {
      price = null;
    }

    if (!PROVIDER_KEY.test(providerKey) || !providerName || !SERVICE_CATEGORIES.has(serviceCategory)
      || !PROVIDER_STATUSES.has(providerStatus) || !ENVIRONMENTS.has(environment)
      || !SERVICE_TYPES.has(serviceType) || !PRODUCT_KEY.test(productKey) || !productName
      || (serviceType !== "hosting" && (!rawTld || !TLD.test(rawTld)))
      || (rawTld !== null && !TLD.test(rawTld))
      || !Number.isInteger(termMonths) || Number(termMonths) < 1 || Number(termMonths) > 120
      || !CURRENCIES.has(currency) || price === null || price < 0n
      || !validUntilRaw || Number.isNaN(validUntil.getTime()) || validUntil.getTime() <= Date.now()
      || (serviceType === "hosting" && serviceCategory !== "hosting")
      || (serviceType !== "hosting" && serviceCategory !== "registrar")
      || hasSensitiveKey(capabilities) || hasSensitiveKey(metadata)
      || !isBoundedJson(capabilities) || !isBoundedJson(metadata)) {
      return reply.code(400).send({
        code: "INVALID_CATALOG_OFFER",
        message: "Offer metadata, provider category, service type, USD price in minor units, term, and future validUntil must be valid.",
      });
    }
    if (!pool) {
      return reply.code(503).send({ code: "DATABASE_NOT_CONFIGURED", message: "Provider catalogue sync requires PostgreSQL." });
    }

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const providerResult = await client.query<{ id: string }>(
          "INSERT INTO provider_catalog_providers (provider_key, display_name, service_category, status, environment, capabilities, last_synced_at) " +
            "VALUES ($1,$2,$3,$4,$5,$6::jsonb,now()) " +
            "ON CONFLICT (provider_key, environment) DO UPDATE SET display_name = EXCLUDED.display_name, " +
            "service_category = EXCLUDED.service_category, status = EXCLUDED.status, capabilities = EXCLUDED.capabilities, " +
            "last_synced_at = now(), updated_at = now() WHERE provider_catalog_providers.service_category = EXCLUDED.service_category " +
            "RETURNING id",
          [providerKey, providerName, serviceCategory, providerStatus, environment, JSON.stringify(capabilities)],
        );
        if (!providerResult.rows[0]) {
          await client.query("ROLLBACK");
          return reply.code(409).send({ code: "PROVIDER_CATEGORY_CONFLICT", message: "This provider key is already registered under a different service category." });
        }
        const offerResult = await client.query<{ id: string }>(
          "INSERT INTO provider_catalog_offers (provider_id, service_type, product_key, product_name, domain_tld, term_months, currency, base_price_minor, is_available, synced_at, valid_until, metadata) " +
            "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),$10,$11::jsonb) " +
            "ON CONFLICT (provider_id, service_type, product_key, term_months, currency) DO UPDATE SET " +
            "product_name = EXCLUDED.product_name, domain_tld = EXCLUDED.domain_tld, base_price_minor = EXCLUDED.base_price_minor, " +
            "is_available = EXCLUDED.is_available, synced_at = now(), valid_until = EXCLUDED.valid_until, metadata = EXCLUDED.metadata, updated_at = now() " +
            "RETURNING id",
          [providerResult.rows[0].id, serviceType, productKey, productName, rawTld, termMonths, currency, price.toString(), available, validUntil, JSON.stringify(metadata)],
        );
        await client.query("COMMIT");
        return reply.code(200).send({ synced: true, offerId: offerResult.rows[0]?.id, priceValidUntil: validUntil.toISOString() });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error({ err: error }, "Unable to synchronize provider catalogue offer");
      return reply.code(500).send({ code: "CATALOG_SYNC_FAILED", message: "Provider offer could not be synchronized." });
    }
  });
}
