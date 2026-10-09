-- DNSOil initial relational model. Provider APIs remain authoritative for registration state.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE provider_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL,
  display_name text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('sandbox','production')),
  status text NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled','testing','active','degraded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_key, environment)
);

CREATE TABLE domain_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES app_users(id),
  provider_connection_id uuid REFERENCES provider_connections(id),
  domain_name text NOT NULL UNIQUE,
  provider_domain_id text,
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('pending','active','expired','transferring','failed','unknown')),
  registered_at timestamptz,
  expires_at timestamptz,
  auto_renew boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  idempotency_key text NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('registration','renewal','transfer','dns')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting_payment','processing','succeeded','failed','needs_reconciliation','cancelled')),
  currency char(3) NOT NULL DEFAULT 'USD',
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  provider_connection_id uuid REFERENCES provider_connections(id),
  provider_operation_id text,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  order_id uuid REFERENCES orders(id),
  provider_key text NOT NULL,
  provider_transaction_id text,
  status text NOT NULL CHECK (status IN ('created','pending','succeeded','failed','refunded','disputed')),
  currency char(3) NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  currency char(3) NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled','active','frozen','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);

CREATE TABLE wallet_ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wallet_accounts(id),
  idempotency_key text NOT NULL UNIQUE,
  source_type text NOT NULL,
  source_id uuid,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wallet_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES wallet_ledger_transactions(id),
  entry_side text NOT NULL CHECK (entry_side IN ('debit','credit')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_domains_owner ON domain_records(owner_user_id);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_payments_order ON payment_transactions(order_id);
CREATE INDEX idx_ledger_account_created ON wallet_ledger_transactions(account_id, created_at DESC);

-- Wallet accounts default to disabled pending legal/compliance review and payment-provider approval.
-- Ledger entries must be written transactionally and balanced before a ledger transaction commits.
