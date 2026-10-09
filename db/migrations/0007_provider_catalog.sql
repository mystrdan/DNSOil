-- Provider-neutral price catalogue for customer choice across registrars and hosting vendors.
-- Only adapter-synchronized offers should be marked available; never seed guessed live prices.
CREATE TABLE provider_catalog_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL CHECK (provider_key ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  service_category text NOT NULL CHECK (service_category IN ('registrar','hosting')),
  status text NOT NULL DEFAULT 'testing' CHECK (status IN ('disabled','testing','active','degraded')),
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox','production')),
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_key, service_category, environment)
);

CREATE TABLE provider_catalog_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES provider_catalog_providers(id),
  service_type text NOT NULL CHECK (service_type IN ('domain-registration','domain-renewal','domain-transfer','hosting')),
  product_key text NOT NULL CHECK (length(trim(product_key)) BETWEEN 1 AND 160),
  product_name text NOT NULL CHECK (length(trim(product_name)) BETWEEN 1 AND 160),
  domain_tld text,
  term_months integer NOT NULL DEFAULT 12 CHECK (term_months BETWEEN 1 AND 120),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  base_price_minor bigint NOT NULL CHECK (base_price_minor >= 0),
  is_available boolean NOT NULL DEFAULT false,
  synced_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_type, product_key, term_months, currency)
);

CREATE INDEX idx_catalog_providers_category_status ON provider_catalog_providers(service_category, status);
CREATE INDEX idx_catalog_offers_lookup ON provider_catalog_offers(service_type, domain_tld, currency, is_available, valid_until);
CREATE INDEX idx_catalog_offers_provider ON provider_catalog_offers(provider_id, is_available, valid_until);

COMMENT ON TABLE provider_catalog_providers IS 'Provider-neutral storefront catalogue. Provider status must be active before offers are shown to customers.';
COMMENT ON TABLE provider_catalog_offers IS 'Provider-synchronized prices, not checkout authorization. valid_until bounds price freshness.';
COMMENT ON COLUMN provider_catalog_offers.base_price_minor IS 'Provider price in integer minor units; DNSOil fees are calculated separately at quote time.';
COMMENT ON COLUMN provider_catalog_offers.metadata IS 'Non-secret offer attributes only; never store API credentials, passwords, or one-time SSO links.';
