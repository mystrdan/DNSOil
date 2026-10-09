-- Wallets remain disabled until legal/compliance and payment-provider approval.
-- Holds reserve funds without prematurely posting a final debit.
CREATE TABLE wallet_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES wallet_accounts(id),
  order_id uuid REFERENCES orders(id),
  idempotency_key text NOT NULL UNIQUE,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL,
  status text NOT NULL DEFAULT 'held' CHECK (status IN ('held','captured','released','expired')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_wallet_holds_account_status ON wallet_holds(account_id, status, created_at DESC);

-- Enforce balanced double-entry transactions at commit, after all entries have been inserted.
CREATE OR REPLACE FUNCTION dnsoil_assert_wallet_transaction_balanced()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_transaction_id uuid;
  debit_total numeric;
  credit_total numeric;
  entry_count integer;
  currency_count integer;
BEGIN
  target_transaction_id := COALESCE(NEW.transaction_id, OLD.transaction_id);

  SELECT
    COALESCE(SUM(amount_minor) FILTER (WHERE entry_side = 'debit'), 0),
    COALESCE(SUM(amount_minor) FILTER (WHERE entry_side = 'credit'), 0),
    COUNT(*),
    COUNT(DISTINCT currency)
  INTO debit_total, credit_total, entry_count, currency_count
  FROM wallet_ledger_entries
  WHERE transaction_id = target_transaction_id;

  -- Deleting a whole transaction's entries during a controlled cascade is not
  -- permitted for posted entries; the trigger below blocks direct mutations.
  IF entry_count = 0 OR debit_total <> credit_total OR currency_count <> 1 THEN
    RAISE EXCEPTION 'Wallet ledger transaction % must contain balanced debit and credit entries in one currency', target_transaction_id
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM wallet_ledger_entries e
    JOIN wallet_ledger_transactions t ON t.id = e.transaction_id
    JOIN wallet_accounts a ON a.id = t.account_id
    WHERE e.transaction_id = target_transaction_id
      AND e.currency <> a.currency
  ) THEN
    RAISE EXCEPTION 'Wallet ledger entries must match the wallet account currency'
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER wallet_ledger_entries_balanced
AFTER INSERT OR UPDATE OR DELETE ON wallet_ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION dnsoil_assert_wallet_transaction_balanced();

-- Posted ledger entries are immutable. Correct mistakes with compensating entries.
CREATE OR REPLACE FUNCTION dnsoil_prevent_wallet_entry_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Posted wallet ledger entries are immutable; use a compensating transaction'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER wallet_ledger_entries_immutable
BEFORE UPDATE OR DELETE ON wallet_ledger_entries
FOR EACH ROW EXECUTE FUNCTION dnsoil_prevent_wallet_entry_mutation();

COMMENT ON TABLE wallet_holds IS 'Reservations against an active wallet; wallet accounts are disabled by default pending compliance approval.';
COMMENT ON FUNCTION dnsoil_assert_wallet_transaction_balanced() IS 'Deferred commit-time double-entry and currency consistency check.';
