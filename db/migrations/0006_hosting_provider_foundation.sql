-- Hosting is a separate provider domain from domain registration.
-- Store provider references and stable control-panel URLs only; never store panel passwords.
CREATE TABLE hosting_provider_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL CHECK (provider_key ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox','production')),
  status text NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled','testing','active','degraded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_key, environment)
);

CREATE TABLE hosting_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  provider_connection_id uuid NOT NULL REFERENCES hosting_provider_connections(id),
  external_service_id text NOT NULL CHECK (length(trim(external_service_id)) BETWEEN 1 AND 200),
  primary_domain text,
  product_name text NOT NULL CHECK (length(trim(product_name)) BETWEEN 1 AND 160),
  plan_name text,
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('provisioning','active','suspended','overdue','cancelled','unknown')),
  renewal_at timestamptz,
  control_panel_url text CHECK (control_panel_url IS NULL OR (control_panel_url ~ '^https://' AND length(control_panel_url) <= 2048 AND control_panel_url !~ '[?#]')),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_connection_id, external_service_id)
);

CREATE INDEX idx_hosting_services_user_status ON hosting_services(user_id, status);
CREATE INDEX idx_hosting_services_renewal ON hosting_services(user_id, renewal_at) WHERE renewal_at IS NOT NULL;

COMMENT ON TABLE hosting_provider_connections IS 'Hosting control-panel/provider integrations; separate from registrar provider_connections.';
COMMENT ON TABLE hosting_services IS 'Provider-synced customer hosting subscriptions. Provider is authoritative for live service state.';
COMMENT ON COLUMN hosting_services.control_panel_url IS 'Stable HTTPS portal URL only; do not persist passwords, session tokens, or one-time SSO links.';
