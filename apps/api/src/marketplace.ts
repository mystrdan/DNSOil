import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { domainToASCII } from "node:url";
import type { Pool } from "pg";

function secretMatches(expected: string | undefined, provided: string | string[] | undefined): boolean {
  if (!expected || typeof provided !== "string" || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function normalizeDomain(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 253) return null;
  const domain = domainToASCII(value.trim().replace(/\.$/, "")).toLowerCase();
  const labels = domain.split(".");
  if (!domain || labels.length < 2 || labels.some((label) => !/^(?!-)[a-z0-9-]{1,63}(?<!-)$/.test(label))
    || !/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels.at(-1) ?? "")) return null;
  return domain;
}

function markupBps(): bigint {
  const raw = Number.parseInt(process.env.DNSOIL_MARKUP_BPS ?? "100", 10);
  return Number.isInteger(raw) && raw >= 0 && raw <= 10_000 ? BigInt(raw) : 100n;
}

function withMarkup(amount: string | null, bps: bigint): { providerPriceMinor: string | null; dnsoilFeeMinor: string | null; customerTotalMinor: string | null } {
  if (amount === null) return { providerPriceMinor: null, dnsoilFeeMinor: null, customerTotalMinor: null };
  const price = BigInt(amount);
  const fee = (price * bps + 9_999n) / 10_000n;
  return { providerPriceMinor: price.toString(), dnsoilFeeMinor: fee.toString(), customerTotalMinor: (price + fee).toString() };
}

export function registerMarketplaceRoutes(app: FastifyInstance, pool: Pool | undefined, internalApiSecret: string | undefined): void {
  app.get<{ Querystring: { domain?: string } }>("/v1/marketplace/domain-quotes", async (request, reply) => {
    const domain = normalizeDomain(request.query.domain);
    if (!domain) return reply.code(400).send({ code: "INVALID_DOMAIN", message: "Provide a valid domain name to compare provider quotes." });
    if (!pool) return reply.code(503).send({ code: "DATABASE_NOT_CONFIGURED", message: "Provider price comparison requires PostgreSQL." });

    try {
      const result = await pool.query<{
        id: string; provider_key: string; provider_name: string; available: boolean;
        registration_minor: string | null; renewal_minor: string | null; transfer_minor: string | null;
        currency: string; term_years: number; checked_at: Date; expires_at: Date;
      }>(
        "SELECT q.id, pc.provider_key, pc.display_name AS provider_name, q.available, q.registration_minor::text, " +
        "q.renewal_minor::text, q.transfer_minor::text, q.currency, q.term_years, q.checked_at, q.expires_at " +
        "FROM domain_price_quotes q JOIN provider_connections pc ON pc.id = q.provider_connection_id " +
        "WHERE q.domain_name = $1 AND q.expires_at > now() AND pc.status = 'active' AND pc.environment = 'production' " +
        "ORDER BY q.registration_minor ASC NULLS LAST, pc.display_name ASC LIMIT 25",
        [domain],
      );
      const bps = markupBps();
      return reply.code(200).send({
        domain,
        quoteStatus: result.rowCount ? "fresh-provider-quotes" : "no-fresh-quotes",
        markupBasisPoints: Number(bps),
        quotes: result.rows.map((quote) => ({
          id: quote.id,
          providerKey: quote.provider_key,
          providerName: quote.provider_name,
          available: quote.available,
          registration: { ...withMarkup(quote.registration_minor, bps), currency: quote.currency },
          renewal: { ...withMarkup(quote.renewal_minor, bps), currency: quote.currency },
          transfer: { ...withMarkup(quote.transfer_minor, bps), currency: quote.currency },
          termYears: quote.term_years,
          checkedAt: quote.checked_at,
          expiresAt: quote.expires_at,
        })),
        note: result.rowCount
          ? "Prices are provider-supplied snapshots. Availability and the final price must be rechecked with the chosen provider before checkout."
          : "No fresh live provider quotes are available. DNSOil does not invent availability or prices.",
      });
    } catch (error) {
      request.log.error({ err: error }, "Unable to compare domain provider quotes");
      return reply.code(500).send({ code: "DOMAIN_QUOTES_FAILED", message: "Provider quotes could not be loaded." });
    }
  });

  app.get("/v1/marketplace/hosting-offers", async (_request, reply) => {
    if (!pool) return reply.code(503).send({ code: "DATABASE_NOT_CONFIGURED", message: "Hosting offers require PostgreSQL." });
    try {
      const result = await pool.query<{
        id: string; provider_key: string; provider_name: string; product_name: string; plan_name: string | null;
        description: string | null; currency: string; billing_period: string; price_minor: string;
        renewal_price_minor: string | null; storage_gb: string | null; bandwidth_gb: string | null;
        includes_email: boolean; includes_ssl: boolean; control_panel: string | null; product_url: string | null;
        last_synced_at: Date;
      }>(
        "SELECT o.id, hp.provider_key, hp.display_name AS provider_name, o.product_name, o.plan_name, o.description, " +
        "o.currency, o.billing_period, o.price_minor::text, o.renewal_price_minor::text, o.storage_gb::text, " +
        "o.bandwidth_gb::text, o.includes_email, o.includes_ssl, o.control_panel, o.product_url, o.last_synced_at " +
        "FROM hosting_catalog_offers o JOIN hosting_provider_connections hp ON hp.id = o.provider_connection_id " +
        "WHERE o.active = true AND hp.status = 'active' AND hp.environment = 'production' " +
        "ORDER BY o.price_minor ASC, hp.display_name ASC LIMIT 100",
      );
      const bps = markupBps();
      return reply.code(200).send({
        markupBasisPoints: Number(bps),
        offers: result.rows.map((offer) => ({
          id: offer.id,
          providerKey: offer.provider_key,
          providerName: offer.provider_name,
          productName: offer.product_name,
          planName: offer.plan_name,
          description: offer.description,
          price: { ...withMarkup(offer.price_minor, bps), currency: offer.currency },
          renewalPrice: { ...withMarkup(offer.renewal_price_minor, bps), currency: offer.currency },
          billingPeriod: offer.billing_period,
          storageGb: offer.storage_gb,
          bandwidthGb: offer.bandwidth_gb,
          includesEmail: offer.includes_email,
          includesSsl: offer.includes_ssl,
          controlPanel: offer.control_panel,
          productUrl: offer.product_url,
          lastSyncedAt: offer.last_synced_at,
        })),
        note: "Offers are provider-synced catalog snapshots. Confirm renewal pricing, taxes, availability and terms with the provider before checkout.",
      });
    } catch (error) {
      _request.log.error({ err: error }, "Unable to load hosting marketplace offers");
      return reply.code(500).send({ code: "HOSTING_OFFERS_FAILED", message: "Hosting offers could not be loaded." });
    }
  });

  app.post<{ Body: Record<string, unknown> }>("/v1/internal/marketplace/domain-quotes/sync", async (request, reply) => {
    if (!secretMatches(internalApiSecret, request.headers["x-dnsoil-internal-secret"])) {
      return reply.code(401).send({ code: "UNAUTHORIZED", message: "Valid internal credentials are required." });
    }
    const body = request.body ?? {};
    const providerKey = typeof body.providerKey === "string" ? body.providerKey.trim().toLowerCase() : "";
    const providerName = typeof body.providerName === "string" ? body.providerName.trim() : "";
    const domain = normalizeDomain(body.domain);
    const environment = body.environment === undefined ? "production" : body.environment;
    const available = body.available;
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "USD";
    const termYears = body.termYears === undefined ? 1 : body.termYears;
    const expiresInSeconds = body.expiresInSeconds === undefined ? 300 : body.expiresInSeconds;
    const amount = (key: string): string | null | undefined => {
      const value = body[key];
      if (value === undefined || value === null || value === "") return null;
      if ((typeof value !== "number" && typeof value !== "string") || !/^\d{1,12}(?:\.\d{1,2})?$/.test(String(value))) return undefined;
      const parts = String(value).split(".");
      return (BigInt(parts[0] ?? "0") * 100n + BigInt(((parts[1] ?? "") + "00").slice(0, 2))).toString();
    };
    const registrationMinor = amount("registrationPrice");
    const renewalMinor = amount("renewalPrice");
    const transferMinor = amount("transferPrice");
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(providerKey) || !providerName || providerName.length > 120
      || !domain || !["sandbox", "production"].includes(String(environment)) || typeof available !== "boolean"
      || !/^[A-Z]{3}$/.test(currency) || !Number.isInteger(termYears) || Number(termYears) < 1 || Number(termYears) > 10
      || !Number.isInteger(expiresInSeconds) || Number(expiresInSeconds) < 30 || Number(expiresInSeconds) > 3600
      || registrationMinor === undefined || renewalMinor === undefined || transferMinor === undefined
      || (available && registrationMinor === null)) {
      return reply.code(400).send({ code: "INVALID_DOMAIN_QUOTE", message: "Provide valid provider details, domain availability, currency, term, prices and quote expiry." });
    }
    if (!pool) return reply.code(503).send({ code: "DATABASE_NOT_CONFIGURED", message: "Quote synchronization requires PostgreSQL." });

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const providerResult = await client.query<{ id: string }>(
          "INSERT INTO provider_connections (provider_key, display_name, environment, status) VALUES ($1, $2, $3, 'active') " +
          "ON CONFLICT (provider_key, environment) DO UPDATE SET display_name = EXCLUDED.display_name, status = 'active', updated_at = now() RETURNING id",
          [providerKey, providerName, environment],
        );
        const providerId = providerResult.rows[0]?.id;
        if (!providerId) throw new Error("Provider connection was not created.");
        const expiresAt = new Date(Date.now() + Number(expiresInSeconds) * 1000);
        const quote = await client.query<{ id: string }>(
          "INSERT INTO domain_price_quotes (provider_connection_id, domain_name, available, registration_minor, renewal_minor, transfer_minor, currency, term_years, expires_at) " +
          "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
          [providerId, domain, available, registrationMinor, renewalMinor, transferMinor, currency, Number(termYears), expiresAt],
        );
        await client.query("COMMIT");
        return reply.code(201).send({ synced: true, quoteId: quote.rows[0]?.id, domain, expiresAt });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error({ err: error }, "Unable to sync domain provider quote");
      return reply.code(500).send({ code: "DOMAIN_QUOTE_SYNC_FAILED", message: "The provider quote could not be synchronized." });
    }
  });
}
