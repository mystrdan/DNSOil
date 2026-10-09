-- Keep transaction metadata append-only as well as the individual ledger entries.
CREATE OR REPLACE FUNCTION dnsoil_prevent_wallet_transaction_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Posted wallet ledger transactions are immutable; use a compensating transaction'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER wallet_ledger_transactions_immutable
BEFORE UPDATE OR DELETE ON wallet_ledger_transactions
FOR EACH ROW EXECUTE FUNCTION dnsoil_prevent_wallet_transaction_mutation();

-- An empty transaction row must not be committed: entry-level deferred checks alone
-- would not fire if a caller inserted a transaction but no entries.
CREATE OR REPLACE FUNCTION dnsoil_assert_wallet_transaction_has_balanced_entries()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  debit_total numeric;
  credit_total numeric;
  entry_count integer;
  currency_count integer;
  account_currency char(3);
BEGIN
  SELECT currency INTO account_currency
  FROM wallet_accounts
  WHERE id = NEW.account_id;

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
    SELECT 1 FROM wallet_ledger_entries
    WHERE transaction_id = NEW.id AND currency <> account_currency
  ) THEN
    RAISE EXCEPTION 'Wallet ledger entries must match the wallet account currency'
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER wallet_ledger_transaction_has_balanced_entries
AFTER INSERT ON wallet_ledger_transactions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION dnsoil_assert_wallet_transaction_has_balanced_entries();
