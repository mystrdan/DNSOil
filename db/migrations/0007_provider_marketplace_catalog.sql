-- Provider selection and price comparison foundations.
-- Prices are snapshots from authorized provider adapters; no fabricated live pricing.
CREATE TABLE domain_price_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_connection_id uuid NOT NULL REFERENCES provider_connections(id),
  domain_name text NOT NULL,
  available boolean NOT NULL,
  registration_minor bigint CHECK (registration_minor IS NULL OR registration_minor >= 0),
  renewal_minor bigint CHECK (renewal_minor IS NULL OR renewal_minor >= 0),
  transfer_minor bigint CHECK (transfer_minor IS NULL OR transfer_minor >= 0),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  term_years integer NOT NULL DEFAULT 1 CHECK (term_years BETWEEN 1 AND 10),
  provider_quote_id text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > checked_at)
);
CREATE INDEX idx_domain_price_quotes_lookup ON domain_price_quotes(domain_name, expires_at DESC);
CREATE INDEX idx_domain_price_quotes_provider ON domain_price_quotes(provider_connection_id, domain_name, checked_at DESC);

CREATE TABLE hosting_catalog_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_connection_id uuid NOT NULL REFERENCES hosting_provider_connections(id),
  external_product_id text NOT NULL,
  product_name text NOT NULL CHECK (length(trim(product_name)) BETWEEN 1 AND 160),
  plan_name text,
  description text,
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly','quarterly','annually','biennially','triennially')),
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  renewal_price_minor bigint CHECK (renewal_price_minor IS NULL OR renewal_price_minor >= 0),
  storage_gb numeric(12,2),
  bandwidth_gb numeric(12,2),
  includes_email boolean NOT NULL DEFAULT false,
  includes_ssl boolean NOT NULL DEFAULT false,
  control_panel text CHECK (control_panel IS NULL OR control_panel IN ('cpanel','plesk','other','none')),
  product_url text CHECK (product_url IS NULL OR (product_url ~ '^https://' AND product_url !~ '[?#]')),
  active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_connection_id, external_product_id)
);
CREATE INDEX idx_hosting_catalog_offers_active ON hosting_catalog_offers(active, price_minor);
COMMENT ON TABLE domain_price_quotes IS 'Short-lived provider availability/pricing snapshots. A quote must be refreshed before checkout.';
COMMENT ON TABLE hosting_catalog_offers IS 'Provider-synced hosting catalog and prices; provider renewal prices are kept separate from first-term prices.';
