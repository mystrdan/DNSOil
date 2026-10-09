-- Separate the customer's wallet liability from system clearing/revenue accounts.
-- A balanced journal must affect at least one customer wallet ledger account and one
-- or more counterpart accounts, otherwise a wallet's net balance would always be zero.
CREATE TABLE wallet_ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_account_id uuid REFERENCES wallet_accounts(id),
  account_key text NOT NULL CHECK (length(trim(account_key)) BETWEEN 1 AND 80),
  account_type text NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (wallet_account_id IS NOT NULL AND account_key = 'customer_wallet' AND account_type = 'liability')
    OR
    (wallet_account_id IS NULL AND account_key <> 'customer_wallet')
  )
);

CREATE UNIQUE INDEX idx_wallet_ledger_customer_account
  ON wallet_ledger_accounts(wallet_account_id, currency)
  WHERE wallet_account_id IS NOT NULL;
CREATE UNIQUE INDEX idx_wallet_ledger_system_account
  ON wallet_ledger_accounts(account_key, currency)
  WHERE wallet_account_id IS NULL;

INSERT INTO wallet_ledger_accounts (wallet_account_id, account_key, account_type, currency)
SELECT id, 'customer_wallet', 'liability', currency
FROM wallet_accounts
ON CONFLICT DO NOTHING;

INSERT INTO wallet_ledger_accounts (wallet_account_id, account_key, account_type, currency)
VALUES
  (NULL, 'payment_clearing', 'asset', 'USD'),
  (NULL, 'registrar_payable', 'liability', 'USD'),
  (NULL, 'platform_revenue', 'revenue', 'USD'),
  (NULL, 'payment_fees', 'expense', 'USD'),
  (NULL, 'wallet_adjustments', 'expense', 'USD')
ON CONFLICT DO NOTHING;

ALTER TABLE wallet_ledger_entries
  ADD COLUMN ledger_account_id uuid REFERENCES wallet_ledger_accounts(id);

-- Preserve pre-existing rows during migration. The schema migration must assign an
-- account reference to historical entries before immutability is re-enabled.
DROP TRIGGER IF EXISTS wallet_ledger_entries_immutable ON wallet_ledger_entries;

UPDATE wallet_ledger_entries e
SET ledger_account_id = la.id
FROM wallet_ledger_transactions t
JOIN wallet_ledger_accounts la
  ON la.wallet_account_id = t.account_id
 AND la.account_key = 'customer_wallet'
WHERE e.transaction_id = t.id
  AND e.ledger_account_id IS NULL;

ALTER TABLE wallet_ledger_entries
  ALTER COLUMN ledger_account_id SET NOT NULL;

CREATE TRIGGER wallet_ledger_entries_immutable
BEFORE UPDATE OR DELETE ON wallet_ledger_entries
FOR EACH ROW EXECUTE FUNCTION dnsoil_prevent_wallet_entry_mutation();

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
  IF TG_OP = 'DELETE' THEN
    target_transaction_id := OLD.transaction_id;
  ELSE
    target_transaction_id := NEW.transaction_id;
  END IF;

  SELECT
    COALESCE(SUM(amount_minor) FILTER (WHERE entry_side = 'debit'), 0),
    COALESCE(SUM(amount_minor) FILTER (WHERE entry_side = 'credit'), 0),
    COUNT(*),
    COUNT(DISTINCT currency)
  INTO debit_total, credit_total, entry_count, currency_count
  FROM wallet_ledger_entries
  WHERE transaction_id = target_transaction_id;

  IF entry_count = 0 OR debit_total <> credit_total OR currency_count <> 1 THEN
    RAISE EXCEPTION 'Wallet ledger transaction % must contain balanced debit and credit entries in one currency', target_transaction_id
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM wallet_ledger_entries e
    JOIN wallet_ledger_transactions t ON t.id = e.transaction_id
    JOIN wallet_accounts wa ON wa.id = t.account_id
    JOIN wallet_ledger_accounts la ON la.id = e.ledger_account_id
    WHERE e.transaction_id = target_transaction_id
      AND (e.currency <> wa.currency OR e.currency <> la.currency)
  ) THEN
    RAISE EXCEPTION 'Wallet ledger entries must match both the wallet and ledger-account currency'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM wallet_ledger_transactions t
    JOIN wallet_ledger_entries e ON e.transaction_id = t.id
    JOIN wallet_ledger_accounts la ON la.id = e.ledger_account_id
    WHERE t.id = target_transaction_id
      AND la.wallet_account_id = t.account_id
      AND la.account_key = 'customer_wallet'
  ) THEN
    RAISE EXCEPTION 'Wallet ledger transaction % must include its own customer wallet ledger account', target_transaction_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION dnsoil_assert_wallet_transaction_has_balanced_entries()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  debit_total numeric;
  credit_total numeric;
  entry_count integer;
  currency_count integer;
BEGIN
  SELECT
    COALESCE(SUM(amount_minor) FILTER (WHERE entry_side = 'debit'), 0),
    COALESCE(SUM(amount_minor) FILTER (WHERE entry_side = 'credit'), 0),
    COUNT(*),
    COUNT(DISTINCT currency)
  INTO debit_total, credit_total, entry_count, currency_count
  FROM wallet_ledger_entries
  WHERE transaction_id = NEW.id;

  IF entry_count = 0 OR debit_total <> credit_total OR currency_count <> 1 THEN
    RAISE EXCEPTION 'Wallet ledger transaction % must contain balanced debit and credit entries in one currency', NEW.id
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM wallet_ledger_entries e
    JOIN wallet_ledger_accounts la ON la.id = e.ledger_account_id
    JOIN wallet_accounts wa ON wa.id = NEW.account_id
    WHERE e.transaction_id = NEW.id
      AND (e.currency <> la.currency OR e.currency <> wa.currency)
  ) THEN
    RAISE EXCEPTION 'Wallet ledger entries must match both the wallet and ledger-account currency'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM wallet_ledger_entries e
    JOIN wallet_ledger_accounts la ON la.id = e.ledger_account_id
    WHERE e.transaction_id = NEW.id
      AND la.wallet_account_id = NEW.account_id
      AND la.account_key = 'customer_wallet'
  ) THEN
    RAISE EXCEPTION 'Wallet ledger transaction % must include its own customer wallet ledger account', NEW.id
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON TABLE wallet_ledger_accounts IS 'Per-customer wallet liability accounts and system counterpart accounts used for true double-entry accounting.';
COMMENT ON COLUMN wallet_ledger_entries.ledger_account_id IS 'The financial account affected by this debit or credit; customer balance is projected from its customer_wallet liability account.';
